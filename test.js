import assert from "assert"
import {readFileSync} from "fs"
import base32 from "hi-base32"

import {
  parseItem,
  parseList,
  parseDict,
  token,
  alt,
  list,
  repeat,
  base64decode,
  base64encode,
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
  list_member,
  sf_item,
  bare_item,
  parameters,
  parameter,
  sf_key,
} from "./index.js"

function log(...arg) {
  try {
    throw new Error()
  } catch (err) {
    const line = err.stack.split(`\n`)[2].split(`/`).pop()
    console.log(line, ...arg)
  }
}

const j = JSON.stringify.bind(JSON)

// read json test suite
function read(name) {
  return JSON.parse(readFileSync(`./structured-field-tests/${name}.json`).toString())
}

// convert "expected" in test.json into comparable
function format(e) {
  if (Array.isArray(e)) {
    return e.map(format)
  }
  switch(e[`__type`]) {
    case `binary`:
      return Uint8Array.from(e.value === `` ? [] : base32.decode.asBytes(e.value))
    case `token`:
      return e.value
    default:
      return e
  }
}

const ok = true;

function test_token() {
  const fn = token(/^abc/)
  assert.deepStrictEqual(fn(`abc`), {ok, value: `abc`, rest: ``})
  assert.deepStrictEqual(fn(`abd`), {ok: false, rest: `abd`})
  assert.deepStrictEqual(fn(``),    {ok: false, rest: ``})
}

function test_alt() {
  // a / b
  const fn = alt([token(/^a/), token(/^b/)])
  assert.deepStrictEqual(fn(`a`), {ok, value: `a`, rest: ``})
  assert.deepStrictEqual(fn(`b`), {ok, value: `b`, rest: ``})
  assert.deepStrictEqual(fn(`c`), {ok: false, rest: `c`})
  assert.deepStrictEqual(fn(``),  {ok: false, rest: ``})
}

function test_list() {
  // [a, b, c]
  let fn = list([token(/^a/), token(/^b/), token(/^c/)])
  assert.deepStrictEqual(fn(`abc`), {ok, value: [`a`, `b`, `c`], rest: ``})
  assert.deepStrictEqual(fn(`axc`), {ok: false, rest: `axc`})
  assert.deepStrictEqual(fn(``),    {ok: false, rest: ``})

  // [ab, cde, f]
  fn = list([token(/^ab/), token(/^cde/), token(/^f/)])
  assert.deepStrictEqual(fn(`abcdef`), {ok, value: [`ab`, `cde`, `f`], rest: ``})
  assert.deepStrictEqual(fn(`abcde`),  {ok: false, rest: `abcde`})
}

function test_repeat() {
  // (a / b){1,5}
  let fn = repeat(1, 5, alt([token(/^a/), token(/^b/)]))
  assert.deepStrictEqual(fn(`a`),       {ok, value: [`a`],      rest: ``})
  assert.deepStrictEqual(fn(`ab`),      {ok, value: [`a`, `b`], rest: ``})
  assert.deepStrictEqual(fn(`b`),       {ok, value: [`b`],      rest: ``})
  assert.deepStrictEqual(fn(`aabaab`),  {ok, value: [`a`, `a`, `b`, `a`, `a`], rest: `b`})
  assert.deepStrictEqual(fn(`aacaaab`), {ok, value: [`a`, `a`], rest: `caaab`})
  assert.deepStrictEqual(fn(`c`),       {ok: false, rest: `c`})
  assert.deepStrictEqual(fn(``),        {ok: false, rest: ``})
}

function test_sf_integer() {
  assert.deepStrictEqual(sf_integer()(`42`),  {ok, value: 42,  rest: ``})
  assert.deepStrictEqual(sf_integer()(`-42`), {ok, value: -42, rest: ``})
  assert.deepStrictEqual(sf_integer()(`4.2`), {ok, value: 4,   rest: `.2`})
  assert.deepStrictEqual(sf_integer()(`4a`),  {ok, value: 4,   rest: `a`})
  assert.deepStrictEqual(sf_integer()(`a`),   {ok: false, rest: `a`})
  assert.deepStrictEqual(sf_integer()(``),    {ok: false, rest: ``})
}

function test_sf_decimal() {
  assert.deepStrictEqual(sf_decimal()(`4.5`),  {ok, value: 4.5,  rest: ``})
  assert.deepStrictEqual(sf_decimal()(`-4.5`), {ok, value: -4.5, rest: ``})
  assert.deepStrictEqual(sf_decimal()(`4.0`),  {ok, value: 4,    rest: ``})
  assert.deepStrictEqual(sf_decimal()(`45`),   {ok: false, rest: `45`})
  assert.deepStrictEqual(sf_decimal()(``),     {ok: false, rest: ``})
}

function test_sf_string() {
  assert.deepStrictEqual(sf_string()(`"asdf"`),  {ok, value: `asdf`, rest: ``})
  assert.deepStrictEqual(sf_string()(`"a""`),    {ok, value: `a`,    rest: `"`})
  assert.deepStrictEqual(sf_string()(`"a\\\""`), {ok, value: `a"`,   rest: ``})
  assert.deepStrictEqual(sf_string()(`"a\\\\c"`),{ok, value: `a\\c`, rest: ``})
  assert.deepStrictEqual(sf_string()(`"a\\"`),   {ok: false, rest: `"a\\"`})
  assert.deepStrictEqual(sf_string()(``),        {ok: false, rest: ``})
}

function test_char() {
  // test_unescaped / test_escaped
}

function test_unescaped() {
  assert.deepStrictEqual(unescaped()(` `),  {ok, value: ` `, rest: ``})   // x20
  assert.deepStrictEqual(unescaped()(`!`),  {ok, value: `!`, rest: ``})   // x21
  assert.deepStrictEqual(unescaped()(`"`),  {ok: false,      rest: `"`})  // x22
  assert.deepStrictEqual(unescaped()(`#`),  {ok, value: `#`, rest: ``})   // x23
  assert.deepStrictEqual(unescaped()(`[`),  {ok, value: `[`, rest: ``})   // x5B
  assert.deepStrictEqual(unescaped()(`\\`), {ok: false,      rest: `\\`}) // x5C
  assert.deepStrictEqual(unescaped()(`]`),  {ok, value: `]`, rest: ``})   // x5D
}

function test_escaped() {
  assert.deepStrictEqual(escaped()(`\\"`),  {ok, value: `"`,  rest: ``})
  assert.deepStrictEqual(escaped()(`\\\\`), {ok, value: `\\`, rest: ``})
  assert.deepStrictEqual(escaped()(`\\a`),  {ok: false,       rest: `\\a`})
}

function test_sf_token() {
  assert.deepStrictEqual(sf_token()(`*foo123/456`),             {ok, value: `*foo123/456`, rest: ``})
  assert.deepStrictEqual(sf_token()(`foo123;456`),              {ok, value: `foo123`, rest: `;456`})
  assert.deepStrictEqual(sf_token()(`ABC!#$%&'*+-.^_'|~:/012`), {ok, value: `ABC!#$%&'*+-.^_'|~:/012`, rest: ``})
  assert.deepStrictEqual(sf_token()(``), {ok: false, rest: ``})
}

function test_sf_binary() {
  const value = Uint8Array.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepStrictEqual(sf_binary()(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), {ok, value, rest: ``})
  assert.deepStrictEqual(sf_binary()(``), {ok:false, rest: ``})
}

function test_sf_boolean() {
  assert.deepStrictEqual(sf_boolean()(`?0`), {ok, value: false, rest: ``})
  assert.deepStrictEqual(sf_boolean()(`?1`), {ok, value: true,  rest: ``})
  assert.deepStrictEqual(sf_boolean()(``),   {ok: false,        rest: ``})
}

function test_sf_list() {
  assert.deepStrictEqual(sf_list()(`"foo", "bar", "It was the best of times."`), {ok, value: [[`foo`,[]], [`bar`,[]], [`It was the best of times.`,[]]], rest: ``})
  assert.deepStrictEqual(sf_list()(`foo, bar`), {ok, value: [[`foo`,[]], [`bar`,[]]], rest: ``})
  assert.deepStrictEqual(sf_list()(``), {ok: false, rest: ``})
}

function test_repeat_list_member() {
  // omit
}

function test_list_member() {
  // test_sf_item / test_inner_list
}

function test_inner_list() {
  assert.deepStrictEqual(inner_list()(`("foo" "bar"), ("baz"), ("bat" "one"), ()`), {ok, value:
    [
      [
        [
          ["foo",[]],
          ["bar",[]]
        ],
        []
      ],
      [
        [
          ["baz",[]]
        ],
        []
      ],
      [
        [
          ["bat",[]],
          ["one",[]]
        ],
        []
      ],
      [
        [],
        []
      ]
    ], rest: ``})

  assert.deepStrictEqual(inner_list()(`("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), {ok, value:
    [
      [
        [
          ['foo', [['a', 1], ['b', 2]] ]
        ],
        [ ['lvl', 5] ]
      ],
      [
        [
          ['bar', []], ['baz', []]
        ],
        [ ['lvl', 1] ]
      ]
    ],
    rest: ``})
}

function test_optional_inner_item() {
  // omit
}

function test_repeat_inner_item() {
  // omit
}

function test_bare_item() {
  assert.deepStrictEqual(bare_item()(`123`),        {ok, value: 123,      rest: ``})
  assert.deepStrictEqual(bare_item()(`3.14`),       {ok, value: 3.14,     rest: ``})
  assert.deepStrictEqual(bare_item()(`string`),     {ok, value: `string`, rest: ``})
  assert.deepStrictEqual(bare_item()(`string`),     {ok, value: `string`, rest: ``})
  assert.deepStrictEqual(bare_item()(`foo123;456`), {ok, value: `foo123`, rest: `;456`})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepStrictEqual(bare_item()(`:${base64encode(binary)}:`), {ok, value: binary, rest: ``})
  assert.deepStrictEqual(bare_item()(`?1`),         {ok, value: true,     rest: ``})
}

function test_sf_key() {
  assert.deepStrictEqual(sf_key()(`a123_-.*`), {ok, value: `a123_-.*`, rest: ``})
  assert.deepStrictEqual(sf_key()(`*a123`),    {ok, value: `*a123`,    rest: ``})
}


function test_parameters() {

  const result = parameters()(`; a; b=?0`)
  const expected = {ok, value: [[`a`, true], [`b`, false]]}
  log(j(result))
  log(j(expected))
  assert.deepStrictEqual(parameters()(`; a; b=?0`), {ok, value: [[`a`, true], [`b`, false]], rest: ``})
}

function structured_field_tests() {

  (() => {
    const suites = [
      ...read(`binary`),
      ...read(`boolean`),
      ...read(`dictionary`),
      ...read(`examples`),
      ...read(`item`),
      ...read(`key-generated`),
      ...read(`large-generated`),
      ...read(`list`),
      ...read(`listlist`),
      ...read(`number-generated`),
      //// ...read(`number`),
      ...read(`param-dict`),
      ...read(`param-list`),
      ...read(`param-listlist`),
      ...read(`string-generated`),
      ...read(`string`),
      ...read(`token-generated`),
      ...read(`token`),
    ]
    suites.forEach((suite) => {
      const ignore = [
        // list.json
        `two line list`,
        // dictionary.json
        `two lines dictionary`,
        `duplicate key dictionary`,
        // param-dict.json
        `two lines parameterised list`,
        // example.json
        `Example-Hdr (list on two lines)`,
        `Example-Hdr (dictionary on two lines)`,
        `0x2c in dictionary key`, // merging keys
        `0x3b in dictionary key`, // merging keys
        `0x3b starting an dictionary key`, // merging keys
        `0x3b in parameterised list key`, // merging keys
      ]
      if (ignore.includes(suite.name)) return

      // console.log(suite.name)

      try {
        let result;
        if (suite.header_type === `item`) {
          result = parseItem(suite.raw[0])
        }
        if (suite.header_type === `list`) {
          result = parseList(suite.raw[0])
        }
        if (suite.header_type === `dictionary`) {
          result = parseDict(suite.raw[0])
        }
        const expected = format(suite.expected)
        assert.deepStrictEqual(result, expected, suite.name)
      } catch(err) {
        assert.deepStrictEqual(suite.must_fail, true)
      }
    })
  })();

  // number
  // use deepEqual insted of deepStrictEqual for allow -0 === 0
  (() => {
    const suites = [
      ...read(`number`),
    ]
    suites.forEach((suite) => {
      try {
        const result = parseItem(suite.raw[0])
        assert.deepEqual(result, suite.expected, suite.name)
      } catch(err) {
        assert.deepStrictEqual(suite.must_fail, true)
      }
    })
    console.log(`number done`)
  })();
}

// private utility
test_token()
test_alt()
test_list()
test_repeat()

test_sf_integer()
test_sf_decimal()

test_sf_string()
test_char()
test_unescaped()
test_escaped()

test_sf_token()
test_sf_binary()
test_sf_boolean()


// test_sf_item()

test_sf_list()


test_sf_list()
test_parameters()

test_sf_key()
test_bare_item()





structured_field_tests()

