import assert from "node:assert"
import test from "node:test"
import base32 from "hi-base32"

import {
  token,
  alt,
  list,
  repeat,
  sf_integer,
  sf_decimal,
  sf_string,
  char,
  unescaped,
  escaped,
  sf_token,
  sf_binary,
  sf_boolean,
  sf_list,
  _repeat_list_member,
  list_member,
  inner_list,
  _optional_inner_item,
  _repeat_inner_item,
  sf_dictionary,
  _repeat_dict_member,
  dict_member,
  member_value,
  sf_item,
  bare_item,
  parameters,
  parameter,
  sf_key,
  sf_date,
} from "../bnf/bnf.js"

import {
  base64decode,
  base64encode,
} from "../index.js"

import {
  log,
  j,
  s,
  ss,
  read,
  format,
  formatItem,
  formatList,
  formatDict,
} from "./test.util.js"

// utility const
const ok = true;

test("test token", () => {
  const fn = token(/^abc/)
  assert.deepStrictEqual(fn(`abc`), {ok, value: `abc`, rest: ``})
  assert.deepStrictEqual(fn(`abd`), {ok: false, rest: `abd`})
  assert.deepStrictEqual(fn(``),    {ok: false, rest: ``})
})

test("test alt", () => {
  // a / b
  const fn = alt([token(/^a/), token(/^b/)])
  assert.deepStrictEqual(fn(`a`), {ok, value: `a`, rest: ``})
  assert.deepStrictEqual(fn(`b`), {ok, value: `b`, rest: ``})
  assert.deepStrictEqual(fn(`c`), {ok: false, rest: `c`})
  assert.deepStrictEqual(fn(``),  {ok: false, rest: ``})
})

test("test list", () => {
  // [a, b, c]
  let fn = list([token(/^a/), token(/^b/), token(/^c/)])
  assert.deepStrictEqual(fn(`abc`), {ok, value: [`a`, `b`, `c`], rest: ``})
  assert.deepStrictEqual(fn(`axc`), {ok: false, rest: `axc`})
  assert.deepStrictEqual(fn(``),    {ok: false, rest: ``})

  // [ab, cde, f]
  fn = list([token(/^ab/), token(/^cde/), token(/^f/)])
  assert.deepStrictEqual(fn(`abcdef`), {ok, value: [`ab`, `cde`, `f`], rest: ``})
  assert.deepStrictEqual(fn(`abcde`),  {ok: false, rest: `abcde`})
})

test("test repeat", () => {
  // (a / b){1,5}
  let fn = repeat(1, 5, alt([token(/^a/), token(/^b/)]))
  assert.deepStrictEqual(fn(`a`),       {ok, value: [`a`],      rest: ``})
  assert.deepStrictEqual(fn(`ab`),      {ok, value: [`a`, `b`], rest: ``})
  assert.deepStrictEqual(fn(`b`),       {ok, value: [`b`],      rest: ``})
  assert.deepStrictEqual(fn(`aabaab`),  {ok, value: [`a`, `a`, `b`, `a`, `a`], rest: `b`})
  assert.deepStrictEqual(fn(`aacaaab`), {ok, value: [`a`, `a`], rest: `caaab`})
  assert.deepStrictEqual(fn(`c`),       {ok: false, rest: `c`})
  assert.deepStrictEqual(fn(``),        {ok: false, rest: ``})
})

test("test sf_integer", () => {
  assert.deepStrictEqual(sf_integer()(`42`),  {ok, value: 42,  rest: ``})
  assert.deepStrictEqual(sf_integer()(`-42`), {ok, value: -42, rest: ``})
  assert.deepStrictEqual(sf_integer()(`4.2`), {ok, value: 4,   rest: `.2`})
  assert.deepStrictEqual(sf_integer()(`4a`),  {ok, value: 4,   rest: `a`})
  assert.deepStrictEqual(sf_integer()(`a`),   {ok: false, rest: `a`})
  assert.deepStrictEqual(sf_integer()(``),    {ok: false, rest: ``})
})

test("test sf_decimal", () => {
  assert.deepStrictEqual(sf_decimal()(`4.5`),  {ok, value: 4.5,  rest: ``})
  assert.deepStrictEqual(sf_decimal()(`-4.5`), {ok, value: -4.5, rest: ``})
  assert.deepStrictEqual(sf_decimal()(`4.0`),  {ok, value: 4,    rest: ``})
  assert.deepStrictEqual(sf_decimal()(`45`),   {ok: false, rest: `45`})
  assert.deepStrictEqual(sf_decimal()(``),     {ok: false, rest: ``})
})

test("test sf_string", () => {
  assert.deepStrictEqual(sf_string()(`"asdf"`),  {ok, value: `asdf`, rest: ``})
  assert.deepStrictEqual(sf_string()(`"a""`),    {ok, value: `a`,    rest: `"`})
  assert.deepStrictEqual(sf_string()(`"a\\\""`), {ok, value: `a"`,   rest: ``})
  assert.deepStrictEqual(sf_string()(`"a\\\\c"`),{ok, value: `a\\c`, rest: ``})
  assert.deepStrictEqual(sf_string()(`"a\\"`),   {ok: false, rest: `"a\\"`})
  assert.deepStrictEqual(sf_string()(``),        {ok: false, rest: ``})
})

test("test char", () => {
  // test_unescaped / test_escaped
})

test("test unescaped", () => {
  assert.deepStrictEqual(unescaped()(` `),  {ok, value: ` `, rest: ``})   // x20
  assert.deepStrictEqual(unescaped()(`!`),  {ok, value: `!`, rest: ``})   // x21
  assert.deepStrictEqual(unescaped()(`"`),  {ok: false,      rest: `"`})  // x22
  assert.deepStrictEqual(unescaped()(`#`),  {ok, value: `#`, rest: ``})   // x23
  assert.deepStrictEqual(unescaped()(`[`),  {ok, value: `[`, rest: ``})   // x5B
  assert.deepStrictEqual(unescaped()(`\\`), {ok: false,      rest: `\\`}) // x5C
  assert.deepStrictEqual(unescaped()(`]`),  {ok, value: `]`, rest: ``})   // x5D
})

test("test escaped", () => {
  assert.deepStrictEqual(escaped()(`\\"`),  {ok, value: `"`,  rest: ``})
  assert.deepStrictEqual(escaped()(`\\\\`), {ok, value: `\\`, rest: ``})
  assert.deepStrictEqual(escaped()(`\\a`),  {ok: false,       rest: `\\a`})
})

test("test sf_token", () => {
  assert.deepStrictEqual(sf_token()(`*foo123/456`),             {ok, value: s(`*foo123/456`),             rest: ``})
  assert.deepStrictEqual(sf_token()(`foo123;456`),              {ok, value: s(`foo123`),                  rest: `;456`})
  assert.deepStrictEqual(sf_token()(`ABC!#$%&'*+-.^_'|~:/012`), {ok, value: s(`ABC!#$%&'*+-.^_'|~:/012`), rest: ``})
  assert.deepStrictEqual(sf_token()(``), {ok: false, rest: ``})
})

test("test sf_binary", () => {
  const value = Uint8Array.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepStrictEqual(sf_binary()(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), {ok, value, rest: ``})
  assert.deepStrictEqual(sf_binary()(``), {ok:false, rest: ``})
})

test("test sf_boolean", () => {
  assert.deepStrictEqual(sf_boolean()(`?0`), {ok, value: false, rest: ``})
  assert.deepStrictEqual(sf_boolean()(`?1`), {ok, value: true,  rest: ``})
  assert.deepStrictEqual(sf_boolean()(``),   {ok: false,        rest: ``})
})

test("test sf_date", () => {
  assert.deepStrictEqual(sf_date()(`@1659578233`),  {ok, value: new Date(1659578233000),          rest: ``})
  assert.deepStrictEqual(sf_date()(`@-1659578233`), {ok, value: new Date('1917-05-30 22:02:47Z'), rest: ``})
  assert.deepStrictEqual(sf_date()(``),             {ok: false,                                   rest: ``})
})

test("test sf_list", () => {
  assert.deepStrictEqual(
    sf_list()(`"foo", "bar", "It was the best of times."`),
    {ok, value: [
      { value: `foo`, params: {} },
      { value: `bar`, params: {} },
      { value: `It was the best of times.`, params: {} }
    ], rest: ``}
  )
  assert.deepStrictEqual(
    sf_list()(`foo, bar`),
    {ok, value: [
      { value: s(`foo`), params: {} },
      { value: s(`bar`), params: {} },
    ], rest: ``}
  )
  assert.deepStrictEqual(
    sf_list()(`("foo" "bar"), ("baz"), ("bat" "one"), ()`),
    {ok, value: [
      {
        value: [
          { value: "foo", params: {} },
          { value: "bar", params: {} }
        ],
        params: {}
      },
      {
        value: [
          { value: "baz", params: {} }
        ],
        params: {}
      },
      {
        value: [
          { value: "bat", params: {} },
          { value: "one", params: {} }
        ],
        params: {}
      },
      {
        value: [],
        params: {}
      }
    ], rest: ``}
  )
  assert.deepStrictEqual(sf_list()(`("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), {ok, value: [
    {
      value: [
        { value: "foo", params: { "a": 1, "b": 2 } }
      ],
      params: { "lvl": 5 }
    },
    {
      value: [
        { value: "bar", params: {} },
        { value: "baz", params: {} }
      ],
      params: { "lvl": 1 }
    }
  ], rest: ``})
  assert.deepStrictEqual(sf_list()(``), {ok: false, rest: ``})
})

test("test repeat_list_member", () => {
  // omit
})

test("test list_member", () => {
  // test_sf_item / test_inner_list
})

test("test inner_list", () => {
  assert.deepStrictEqual(inner_list()(`( 1 2 3 )`), {ok, value: {
    value: [
      { value: 1, params: {} },
      { value: 2, params: {} },
      { value: 3, params: {} }
    ],
    params: {}
  }, rest: ``})
  assert.deepStrictEqual(inner_list()(`(1)`), {ok, value: {
    value: [
      { value: 1, params: {} },
    ],
    params: {}
  }, rest: ``})
  assert.deepStrictEqual(inner_list()(`()`), {ok, value: {
    value: [],
    params: {}
  }, rest: ``})
})

test("test optional_inner_item", () => {
  // omit
})

test("test repeat_inner_item", () => {
  // omit
})

test("test sf_dictionary", () => {
  assert.deepStrictEqual(sf_dictionary()(`en="Applepie", da=:w4ZibGV0w6ZydGU=:`), {ok, value: {
    "en": { value: `Applepie`, params: {} },
    "da": { value: new Uint8Array([195,134,98,108,101,116,195,166,114,116,101]), params: {} }
  }, rest: ``})

  assert.deepEqual(sf_dictionary()(`a=?0, b, c; foo=bar`), {ok, value: {
    "a": { value: false, params: {} },
    "b": { value: true,  params: {} },
    "c": { value: true,  params: { "foo": s("bar") } }
  }, rest: `` })

  assert.deepStrictEqual(sf_dictionary()(`rating=1.5, feelings=(joy sadness)`), {ok, value: {
    "rating": { value: 1.5, params: {} },
    "feelings": {
      value: [
        { value: s("joy"),     params: {} },
        { value: s("sadness"), params: {} }
      ],
      params: {}
    }
  }, rest:``})

  assert.deepStrictEqual(sf_dictionary()(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {ok, value: {
    "a": {
      value: [
        { value: 1, params: {} },
        { value: 2, params: {} }
      ],
      params: {}
    },
    "b": {
      value: 3,
      params: {},
    },
    "c": {
      value: 4,
      params: { "aa": s("bb") },
    },
    "d": {
      value: [
        { value: 5, params: {} },
        { value: 6, params: {} }
      ],
      params: { "valid": true }
    },
  }, rest: ``})
})

test("test repeat_dict_member", () => {
  // omit
})

test("test dict_member", () => {
  // omit
})

test("test member_value", () => {
  // test_sf_item / test_inner_list
})

test("test sf_item", () => {
  assert.deepStrictEqual(sf_item()(`123;a=1;b`), {ok, value: {value: 123, params: {"a":1, "b":true}}, rest: ``})
  assert.deepStrictEqual(sf_item()(``),          {ok: false, rest: ``})
})

test("test bare_item", () => {
  assert.deepStrictEqual(bare_item()(`123`),        {ok, value: 123,         rest: ``})
  assert.deepStrictEqual(bare_item()(`3.14`),       {ok, value: 3.14,        rest: ``})
  assert.deepStrictEqual(bare_item()(`string`),     {ok, value: s(`string`), rest: ``})
  assert.deepStrictEqual(bare_item()(`string`),     {ok, value: s(`string`), rest: ``})
  assert.deepStrictEqual(bare_item()(`foo123;456`), {ok, value: s(`foo123`), rest: `;456`})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepStrictEqual(bare_item()(`:${base64encode(binary)}:`), {ok, value: binary, rest: ``})
  assert.deepStrictEqual(bare_item()(`?1`),         {ok, value: true,     rest: ``})
})

test("test parameters", () => {
  assert.deepStrictEqual(parameters()(`;a=0`),         {ok, value: {"a": 0},                         rest: ``})
  assert.deepStrictEqual(parameters()(`;a`),           {ok, value: {"a": true},                      rest: ``})
  assert.deepStrictEqual(parameters()(`;  a;  b=?0`),  {ok, value: {"a": true, "b": false},          rest: ``})
  assert.deepStrictEqual(parameters()(`;a;b=?0;c=10`), {ok, value: {"a": true, "b": false, "c": 10}, rest: ``})
})

test("test parameter", () => {
  assert.deepStrictEqual(parameter()(`a`),    {ok, value: [`a`, true],  rest: ``})
  assert.deepStrictEqual(parameter()(`b=?0`), {ok, value: [`b`, false], rest: ``})
  assert.deepStrictEqual(parameter()(`c=10`), {ok, value: [`c`, 10],    rest: ``})
  assert.deepStrictEqual(parameter()(``),     {ok: false, rest: ``})
})

test("test sf_key", () => {
  assert.deepStrictEqual(sf_key()(`a123_-.*`), {ok, value: `a123_-.*`, rest: ``})
  assert.deepStrictEqual(sf_key()(`*a123`),    {ok, value: `*a123`,    rest: ``})
})