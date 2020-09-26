import assert from 'assert'

import {
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
} from './index.js'

const ok = true;

function test_token() {
  const fn = token(/^abc/)
  assert.deepEqual(
    fn("abc"),
    {ok, value: "abc", rest: ""}
  )
  assert.deepEqual(
    fn("abd"),
    {ok: false, rest: "abd"}
  )
}

function test_alt() {
  // a / b
  const fn = alt([token(/^a/), token(/^b/)])
  assert.deepEqual(
    fn("a"),
    {ok, value: "a", rest: ""}
  )
  assert.deepEqual(
    fn("b"),
    {ok, value: "b", rest: ""}
  )
  assert.deepEqual(
    fn("c"),
    {ok: false, rest: "c"}
  )
}

function test_list() {
  // [a, b, c]
  let fn = list([token(/^a/), token(/^b/), token(/^c/)])
  assert.deepEqual(
    fn("abc"),
    {ok, value: ["a", "b", "c"], rest: ""}
  )
  assert.deepEqual(
    fn("axc"),
    {ok: false, rest: "axc"}
  )

  // [ab, cde, f]
  fn = list([token(/^ab/), token(/^cde/), token(/^f/)])
  assert.deepEqual(
    fn("abcdef"),
    {ok, value: ["ab", "cde", "f"], rest: ""}
  )
  assert.deepEqual(
    fn("abcde"),
    {ok: false, rest: "abcde"}
  )
}

function test_repeat() {
  let fn = repeat(0, 5, alt([token(/^a/), token(/^b/)]))
  assert.deepEqual(
    fn("a"),
    {ok, value: "a", rest: ""}
  )
  assert.deepEqual(
    fn("ab"),
    {ok, value: "ab", rest: ""}
  )
  assert.deepEqual(
    fn("b"),
    {ok, value: "b", rest: ""}
  )
  assert.deepEqual(
    fn("c"),
    {ok:false, rest: "c"}
  )
  assert.deepEqual(
    fn("aabaab"),
    {ok, value: "aabaa", rest: "b"}
  )
  assert.deepEqual(
    fn("aacaaab"),
    {ok, value: "aa", rest: "caaab"}
  )
}

function test_sf_integer() {
  assert.deepEqual(
    sf_integer()("42"),
    {ok, value: 42, rest: ""}
  )
  assert.deepEqual(
    sf_integer()("-42"),
    {ok, value: -42, rest: ""}
  )
  assert.deepEqual(
    sf_integer()("4.2"),
    {ok, value: 4, rest: ".2"}
  )
  assert.deepEqual(
    sf_integer()("4a"),
    {ok, value: 4, rest: "a"}
  )
  assert.deepEqual(
    sf_integer()("a"),
    {ok: false, rest: "a"}
  )
}

function test_sf_decimal() {
  assert.deepEqual(
    sf_decimal()("4.5"),
    {ok, value: 4.5, rest: ""}
  )
  assert.deepEqual(
    sf_decimal()("-4.5"),
    {ok, value: -4.5, rest: ""}
  )
  assert.deepEqual(
    sf_decimal()("4.0"),
    {ok, value: 4, rest: ""}
  )
  assert.deepEqual(
    sf_decimal()("45"),
    {ok: false, rest: "45"}
  )
}

function test_sf_string() {
  assert.deepEqual(sf_string()(`"asdf"`),  {ok, value: `"asdf"`,  rest: ``})
  assert.deepEqual(sf_string()(`"a""`),    {ok, value: `"a"`,     rest: `"`})
  assert.deepEqual(sf_string()(`"a\\\""`), {ok, value: `"a\\\""`, rest: ``})
  assert.deepEqual(sf_string()(`"a\\"`),   {ok: false, rest: `"a\\"`})
  assert.deepEqual(sf_string()(`"a\\\\c"`),{ok, value: `"a\\\\c"`, rest: ``})
}

function test_char() {
  assert.deepEqual(char()('"'),    {ok: false,        rest: '"'})
  assert.deepEqual(char()("\\\""), {ok, value: '\\\"', rest: ''})
  assert.deepEqual(char()("\\\\"), {ok, value: '\\\\', rest: ''})
}

function test_unescaped() {
  assert.deepEqual(unescaped()(" "),  {ok, value: ' ', rest: ''})   // x20
  assert.deepEqual(unescaped()("!"),  {ok, value: '!', rest: ''})   // x21
  assert.deepEqual(unescaped()('"'),  {ok: false,      rest: '"'})  // x22
  assert.deepEqual(unescaped()("#"),  {ok, value: '#', rest: ''})   // x23
  assert.deepEqual(unescaped()("["),  {ok, value: '[', rest: ''})   // x5B
  assert.deepEqual(unescaped()(`\\`), {ok: false,      rest: '\\'}) // x5C
  assert.deepEqual(unescaped()("]"),  {ok, value: ']', rest: ''})   // x5D
}
function test_escaped() {
  assert.deepEqual(escaped()(`\\\"`), {ok, value: `\\\"`, rest: ''})
  assert.deepEqual(escaped()(`\\\\`), {ok, value: `\\\\`, rest: ''})
}

function test_sf_token() {
  assert.deepEqual(sf_token()(`*foo123/456`), {ok, value: `*foo123/456`, rest: ''})
  assert.deepEqual(sf_token()(`foo123;456`), {ok, value: `foo123`, rest: ';456'})
  assert.deepEqual(sf_token()(`ABC!#$%&'*+-.^_'|~:/012`), {ok, value: `ABC!#$%&'*+-.^_'|~:/012`, rest: ''})
}

function test_sf_binary() {
  const value = Buffer.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepEqual(sf_binary()(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), {ok, value, rest: ''})
}

function test_sf_boolean() {
  assert.deepEqual(sf_boolean()(`?0`), {ok, value: false, rest: ''})
  assert.deepEqual(sf_boolean()(`?1`), {ok, value: true,  rest: ''})
}

function test_bare_item() {
  assert.deepEqual(bare_item()(`123`),        {ok, value: 123,      rest: ''})
  assert.deepEqual(bare_item()(`3.14`),       {ok, value: 3.14,     rest: ''})
  assert.deepEqual(bare_item()(`string`),     {ok, value: `string`, rest: ''})
  assert.deepEqual(bare_item()(`string`),     {ok, value: `string`, rest: ''})
  assert.deepEqual(bare_item()(`foo123;456`), {ok, value: `foo123`, rest: ';456'})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepEqual(bare_item()(`:${base64encode(binary)}:`), {ok, value: binary, rest: ''})
  assert.deepEqual(bare_item()(`?1`),         {ok, value: true,     rest: ''})
}

function test_sf_key() {
  assert.deepEqual(sf_key()(`a123_-.*`), {ok, value: `a123_-.*`, rest: ''})
  assert.deepEqual(sf_key()(`*a123`),    {ok, value: `*a123`,    rest: ''})
}
// test_sf_key()


// test_bare_item()
//test_token()
//test_alt()
//test_list()
//test_repeat()
//
//test_sf_integer()
//test_sf_decimal()
//
//test_sf_string()
//test_char()
//test_unescaped()
//test_escaped()
//
//test_sf_token()
//test_sf_binary()
//test_sf_boolean()
