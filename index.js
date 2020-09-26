"use strict";
import assert from "assert";
let tmp
const ok = true

const log = console.log.bind(console)

function token(reg) {
  return (rest) => {
    const result = reg.exec(rest)
    if (result === null) {
      return {ok: false, rest}
    } else {
      const value = result[0]
      return {ok, value, rest: rest.substr(value.length)}
    }
  }
}

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

function alt(fns) {
  return (rest) => {
    for (let i = 0; i < fns.length; i ++) {
      const result = fns[i](rest)
      if (result.ok) {
        return result
      }
    }
    return {ok: false, rest}
  }
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

function list(fns) {
  return (rest) => {
    const value = []
    const orig  = rest
    for (let i = 0; i < fns.length; i ++) {
      const result = fns[i](rest)
      if (result.ok) {
        value.push(result.value)
        rest = result.rest
        if (rest.length === 0) break
      }
    }

    if (value.length == fns.length) {
      return {ok, value, rest}
    } else {
      return {ok: false, rest: orig}
    }
  }
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

function repeat(min, max, fn) {
  return (rest) => {
    const value = []
    const found = 0
    const orig  = rest
    while(true) {
      const result = fn(rest)
      if (result.ok) {
        value.push(result.value)
        rest = result.rest
        if (value.length === max) break
      } else {
        break
      }
    }

    if (value.length <= min) {
      return {ok: false, rest: orig}
    } else {
      return {ok, value: value.join(""), rest}
    }
  }
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

function sf_integer() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,15}/)(rest)
    if (result.ok) {
      return {ok, value: parseInt(result.value), rest: result.rest}
    } else {
      return {ok: false, rest}
    }
  }
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

function sf_decimal() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,12}\.\d{1,3}/)(rest)
    if (result.ok) {
      return {ok, value: parseFloat(result.value), rest: result.rest}
    } else {
      return {ok: false, rest}
    }
  }
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

function sf_string() {
  return function(rest) {
    const fn = list([
      token(/^"/),
      repeat(0, 1024, sf_char()),
      token(/^"/),
    ])
    const result = fn(rest)
    if (result.ok) {
      result.value = result.value.join('')
      return result
    } else {
      return result
    }
  }
}

function test_sf_string() {
  assert.deepEqual(sf_string()(`"asdf"`),  {ok, value: `"asdf"`,  rest: ``})
  assert.deepEqual(sf_string()(`"a""`),    {ok, value: `"a"`,     rest: `"`})
  assert.deepEqual(sf_string()(`"a\\\""`), {ok, value: `"a\\\""`, rest: ``})
  assert.deepEqual(sf_string()(`"a\\"`),   {ok: false, rest: `"a\\"`})
  assert.deepEqual(sf_string()(`"a\\\\c"`),{ok, value: `"a\\\\c"`, rest: ``})
}

function sf_char() {
  return alt([
    escaped(),
    unescaped(),
  ])
}

function test_sf_char() {
  assert.deepEqual(sf_char()('"'),    {ok: false,        rest: '"'})
  assert.deepEqual(sf_char()("\\\""), {ok, value: '\\\"', rest: ''})
  assert.deepEqual(sf_char()("\\\\"), {ok, value: '\\\\', rest: ''})
}

function unescaped() {
  return token(/^([\x20-\x21])|([\x23-\x5B])|([\x5D-\x7E])/)
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

function escaped() {
  return token(/^((\\\")|(\\\\))/)
}

function test_escaped() {
  assert.deepEqual(escaped()(`\\\"`), {ok, value: `\\\"`, rest: ''})
  assert.deepEqual(escaped()(`\\\\`), {ok, value: `\\\\`, rest: ''})
}


function sf_token() {
  return token(/^([a-zA-Z\*])([\!\#\$\%\&\'\*\+\-\.\^\_\`\|\~\w\:\/]){0,512}/)
}

function test_sf_token() {
  assert.deepEqual(sf_token()(`*foo123/456`), {ok, value: `*foo123/456`, rest: ''})
  assert.deepEqual(sf_token()(`foo123;456`), {ok, value: `foo123`, rest: ';456'})
  assert.deepEqual(sf_token()(`abc!#$%&'*+-.^_'|~:/012`), {ok, value: `abc!#$%&'*+-.^_'|~:/012`, rest: ''})
}


function base64decode(str) {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'base64')
  } else {
    return new Uint8Array([...atob(str)].map(a => a.charCodeAt(0)));
  }
}

function base64encode(binary) {
  if (typeof window === 'undefined') {
    return Buffer.from(binary).toString('base64')
  } else {
  }

}

function sf_binary() {
  return (rest) => {
    const result = list([
      token(/^:/),
      token(/^([\w+/=]){0,16384}/),
      token(/^:/),
    ])(rest)

    if (result.ok) {
      result.value = base64decode(result.value[1]) // remove ":"
      return result
    } else {
      return result
    }
  }
}

function test_sf_binary() {
  const value = Buffer.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepEqual(sf_binary()(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), {ok, value, rest: ''})
}

function sf_boolean() {
  return (rest) => {
    const result = token(/^((\?0)|(\?1))/)(rest)
    if (result.ok) {
      result.value = result.value === '?1'
      return result
    } else {
      return result
    }
  }
}

function test_sf_boolean() {
  assert.deepEqual(sf_boolean()(`?0`), {ok, value: false, rest: ''})
  assert.deepEqual(sf_boolean()(`?1`), {ok, value: true,  rest: ''})
}



// bare-item
//       = sf-integer
//       / sf-decimal
//       / sf-string
//       / sf-token
//       / sf-binary
//       / sf-boolean
function sf_bare_item() {
  return alt([
    sf_decimal(),
    sf_integer(),
    sf_string(),
    sf_token(),
    sf_binary(),
    sf_boolean(),
  ])
}

function test_sf_bare_item() {
  assert.deepEqual(sf_bare_item()(`123`),        {ok, value: 123,      rest: ''})
  assert.deepEqual(sf_bare_item()(`3.14`),       {ok, value: 3.14,     rest: ''})
  assert.deepEqual(sf_bare_item()(`string`),     {ok, value: `string`, rest: ''})
  assert.deepEqual(sf_bare_item()(`string`),     {ok, value: `string`, rest: ''})
  assert.deepEqual(sf_bare_item()(`foo123;456`), {ok, value: `foo123`, rest: ';456'})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepEqual(sf_bare_item()(`:${base64encode(binary)}:`), {ok, value: binary, rest: ''})
  assert.deepEqual(sf_bare_item()(`?1`),         {ok, value: true,     rest: ''})
}
test_sf_bare_item()


test_token()
test_alt()
test_list()
test_repeat()

test_sf_integer()
test_sf_decimal()

test_sf_string()
test_sf_char()
test_unescaped()
test_escaped()

test_sf_token()
test_sf_binary()
test_sf_boolean()
