import * as assert from "node:assert"
import test from "node:test"
import {readFileSync} from "node:fs"


import {
  Item,
  InnerList,

  encodeItem,
  encodeList,
  encodeDict,
  decodeItem,
  decodeList,
  decodeDict,
  decodeMap,

  serializeList,
  // serializeInnerList,
  // serializeParams,
  serializeKey,
  serializeDict,
  // serializeItem,
  serializeBareItem,
  serializeInteger,
  serializeDecimal,
  serializeString,
  serializeToken,
  serializeBoolean,
  serializeByteSequence,
  serializeDisplayString,

  parseList,
  parseItemOrInnerList,
  parseInnerList,
  parseDictionary,
  parseItem,
  parseBareItem,
  parseParameters,
  parseKey,
  parseIntegerOrDecimal,
  parseString,
  parseToken,
  parseByteSequence,
  parseBoolean,
  parseDate,
  parseDisplayString,

  base64decode,
  base64encode,
  leadingSP,
  leadingOWS
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

const ONLY = { only: true }
const SKIP = { skip: true }

test("test decodeItem", () => {
  assert.deepStrictEqual(decodeItem(`"a"`), new Item("a"))
  assert.deepStrictEqual(decodeItem(`?1`), new Item(true))
  assert.deepStrictEqual(decodeItem(`1`), new Item(1))
  assert.deepStrictEqual(decodeItem(`a`), new Item(Symbol.for('a')))
  assert.deepStrictEqual(decodeItem(`:AQID:`), new Item(new Uint8Array([1, 2, 3])))
  assert.deepStrictEqual(decodeItem(`@1659578233`), new Item(new Date(1659578233*1000)))
  assert.deepStrictEqual(decodeItem(`%"foo bar"`), new Item("foo bar"))
  assert.deepStrictEqual(decodeItem(`%"f%c3%bc%c3%bc"`), new Item("füü"))
  assert.throws(() => decodeItem(`1;`), (err) => {
    assert.deepStrictEqual(err.message,       `failed to parse "1;" as Item`)
    assert.deepStrictEqual(err.cause.message, `failed to parse "" as Key`)
    return true
  })
})

test("test encodeItem", () => {
  assert.deepStrictEqual(encodeItem("a"), `"a"`)
  assert.deepStrictEqual(encodeItem("füü"), `%"f%c3%bc%c3%bc"`)
  assert.deepStrictEqual(encodeItem(true), `?1`)
  assert.deepStrictEqual(encodeItem(1), `1`)
  assert.deepStrictEqual(encodeItem(Symbol.for('a')), `a`)
  assert.deepStrictEqual(encodeItem(new Uint8Array([1,2,3])), `:AQID:`)
  assert.deepStrictEqual(encodeItem(new Date(1659578233000)), `@1659578233`)

  assert.deepStrictEqual(encodeItem(new Item("a")),  `"a"`)
  assert.deepStrictEqual(encodeItem(new Item("füü")), `%"f%c3%bc%c3%bc"`)
  assert.deepStrictEqual(encodeItem(new Item(true)), `?1`)
  assert.deepStrictEqual(encodeItem(new Item(1)),    `1`)
  assert.deepStrictEqual(encodeItem(new Item(Symbol.for('a'))), `a`)
  assert.deepStrictEqual(encodeItem(new Item(new Uint8Array([1,2,3]))), `:AQID:`)
  assert.deepStrictEqual(encodeItem(new Item(new Date(1659578233000))), `@1659578233`)

  assert.throws(() => encodeItem(function(){}), /failed to serialize "function\(\)\{\}" as Bare Item/)
  assert.throws(() => encodeItem(() => {}),     /failed to serialize "\(\) => \{\}" as Bare Item/)
  assert.throws(() => encodeItem(999n),         /failed to serialize "999" as Bare Item/)
  assert.throws(() => encodeItem([]),           /failed to serialize "\[\]" as Bare Item/)
  assert.throws(() => encodeItem(new Map()),    /failed to serialize "Map{}" as Bare Item/)
  assert.throws(() => encodeItem(new Set()),    /failed to serialize "Set{}" as Bare Item/)
  assert.throws(() => encodeItem(null),         /failed to serialize "null" as Bare Item/)
  assert.throws(() => encodeItem(undefined),    /failed to serialize "undefined" as Bare Item/)
})

test("test decodeList", () => {
  assert.deepStrictEqual(decodeList(``), [])
  assert.deepStrictEqual(decodeList(`("foo";a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), [
    new InnerList(
      [new Item("foo", {a: 1, b: 2})],
      { "lvl": 5 }
    ),
    new InnerList(
      [new Item("bar"), new Item("baz")],
      { "lvl": 1 }
    ),
  ])
  assert.throws(() => decodeList(`1,2,3)`), (err) => {
    assert.deepStrictEqual(err.message,       `failed to parse "1,2,3)" as List`)
    assert.deepStrictEqual(err.cause.message, `failed to parse ")" as List`)
    return true
  })
  assert.throws(() => decodeList(`1,2,`), (err) => {
    assert.deepStrictEqual(err.message,       `failed to parse "1,2," as List`)
    assert.deepStrictEqual(err.cause.message, `failed to parse "" as List`)
    return true
  })
})

test("test encodeList", () => {
  assert.deepStrictEqual(encodeList([]),       ``)
  assert.deepStrictEqual(encodeList([1,2,3]),  `1, 2, 3`)
  assert.deepStrictEqual(encodeList([
    new Item(1),
    new Item(2),
    new Item(3)
  ]),  `1, 2, 3`)
  assert.deepStrictEqual(encodeList([
    new Item(1, {a: 2}),
    new Item(2, {a: 2}),
    new Item(3, {a: 2})
  ]),  `1;a=2, 2;a=2, 3;a=2`)
})

test("test encodeDict", () => {
  assert.deepStrictEqual(encodeDict({}), ``)
  assert.deepStrictEqual(encodeDict(new Map()), ``)
  assert.deepStrictEqual(
    encodeDict({
      a: 10,
      b: 20,
      c: 30,
    }),
    `a=10, b=20, c=30`
  )
  assert.deepStrictEqual(
    encodeDict(new Map([
      ["a", 10],
      ["b", 20],
      ["c", 30],
    ])),
    `a=10, b=20, c=30`
  )
  assert.deepStrictEqual(
    encodeDict({
      a: 1,
      b: false,
      c: "x",
      d: Symbol.for("y"),
      e: new Uint8Array([1,2,3])
    }),
    `a=1, b=?0, c="x", d=y, e=:AQID:`
  )
  assert.deepStrictEqual(
    encodeDict(new Map([
      ["a", 1],
      ["b", false],
      ["c", "x"],
      ["d", Symbol.for("y")],
      ["e", new Uint8Array([1,2,3])],
    ])),
    `a=1, b=?0, c="x", d=y, e=:AQID:`
  )
  assert.deepStrictEqual(
    encodeDict({
      a: new Item(1),
      b: new Item(false),
      c: new Item("x"),
      d: new Item(Symbol.for("y")),
      e: new Item(new Uint8Array([1,2,3])),
    }),
    `a=1, b=?0, c="x", d=y, e=:AQID:`
  )
  assert.deepStrictEqual(
    encodeDict(new Map([
      ['a', new Item(1)],
      ['b', new Item(false)],
      ['c', new Item("x")],
      ['d', new Item(Symbol.for("y"))],
      ['e', new Item(new Uint8Array([1,2,3]))],
    ])),
    `a=1, b=?0, c="x", d=y, e=:AQID:`
  )
})

test("test decodeDict", () => {
  assert.deepStrictEqual(decodeDict(``), {})
  assert.deepStrictEqual(decodeDict(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {
    "a": new InnerList([new Item(1), new Item(2)]),
    "b": new Item(3),
    "c": new Item(4, { "aa": s("bb") }),
    "d": new InnerList([new Item(5), new Item(6)], { "valid": true })
  })
  assert.throws(() => decodeDict(`a=1, b=2)`), (err) => {
    assert.deepStrictEqual(err.message,       `failed to parse "a=1, b=2)" as Dict`)
    assert.deepStrictEqual(err.cause.message, `failed to parse ")" as Dict`)
    return true
  })
})

test("test decodeMap", () => {
  assert.deepStrictEqual(decodeMap(``), new Map())
  assert.deepStrictEqual(decodeMap(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), new Map([
    ["a", new InnerList([new Item(1), new Item(2)])],
    ["b", new Item(3)],
    ["c", new Item(4, { "aa": s("bb") })],
    ["d", new InnerList([new Item(5), new Item(6)], { "valid": true })]
  ]))
  assert.throws(() => decodeDict(`a=1, b=2)`), (err) => {
    assert.deepStrictEqual(err.message,       `failed to parse "a=1, b=2)" as Dict`)
    assert.deepStrictEqual(err.cause.message, `failed to parse ")" as Dict`)
    return true
  })
})

test("test utility", async (t) => {
  await t.test("test leadingSP", () => {
    assert.deepStrictEqual(leadingSP("   a "), "a ")
    assert.deepStrictEqual(leadingSP(" \t  a "), "\t  a ")
    assert.deepStrictEqual(leadingSP("a "), "a ")
  })

  await t.test("test leadingOWS", () => {
    assert.deepStrictEqual(leadingOWS("   a "), "a ")
    assert.deepStrictEqual(leadingOWS("\t  a "), "a ")
    assert.deepStrictEqual(leadingOWS("a "), "a ")
  })
})

test("test serializeList", () => {
  assert.deepStrictEqual(serializeList([1, 2, 3]), "1, 2, 3")
  assert.deepStrictEqual(serializeList([]), "")
  assert.throws(() => serializeList({}), /failed to serialize "{}" as List/)
})

test("test serializeKey", () => {
  assert.deepStrictEqual(serializeKey(`a`),       "a")
  assert.deepStrictEqual(serializeKey(`*`),       "*")
  assert.deepStrictEqual(serializeKey(`*-_.*`),   "*-_.*")
  assert.deepStrictEqual(serializeKey(`****`),    "****")
  assert.deepStrictEqual(serializeKey(`a*`),      "a*")
  assert.deepStrictEqual(serializeKey(`a*0-_.*`), "a*0-_.*")
  assert.throws(() => serializeKey(`#`), /failed to serialize "#" as Key/)
  assert.throws(() => serializeKey(`?`), /failed to serialize "\?" as Key/)
  assert.throws(() => serializeKey(0),   /failed to serialize "0" as Key/)
})

test("test serializeDict", () => {
  assert.deepStrictEqual(serializeDict(new Map()), "")
  assert.deepStrictEqual(serializeDict(new Map([["a", 2]])), "a=2")
  assert.throws(() => serializeDict(0), /failed to serialize "0" as Dict/)
})

test("test serializeBareItem", () => {
  assert.throws(() => serializeBareItem([]), /failed to serialize "\[\]" as Bare Item/)
  assert.throws(() => serializeBareItem({}), /failed to serialize "{}" as Bare Item/)
  assert.throws(() => serializeBareItem(NaN), /failed to serialize "NaN" as Bare Item/)
  assert.throws(() => serializeBareItem(Infinity), /failed to serialize "Infinity" as Bare Item/)
})

test("test serializeInteger", () => {
  assert.deepStrictEqual(serializeInteger(0),  "0")
  assert.deepStrictEqual(serializeInteger(1),  "1")
  assert.deepStrictEqual(serializeInteger(-1), "-1")
  assert.deepStrictEqual(serializeInteger( 999_999_999_999_999),  "999999999999999")
  assert.deepStrictEqual(serializeInteger(-999_999_999_999_999), "-999999999999999")
  assert.throws(() => serializeInteger( 1_000_000_000_000_000), /failed to serialize "1000000000000000" as Integer/)
  assert.throws(() => serializeInteger(-1_000_000_000_000_000), /failed to serialize "-1000000000000000" as Integer/)
})

test("test serializeDecimal", () => {
  assert.deepStrictEqual(serializeDecimal(0),       "0.0")
  assert.deepStrictEqual(serializeDecimal(1.0),     "1.0")
  assert.deepStrictEqual(serializeDecimal(1.01),    "1.01")
  assert.deepStrictEqual(serializeDecimal(1.0021),  "1.002")
  assert.deepStrictEqual(serializeDecimal(1.0029),  "1.003")
  assert.deepStrictEqual(serializeDecimal(1.0025),  "1.002")
  assert.deepStrictEqual(serializeDecimal(1.0035),  "1.004")
  assert.deepStrictEqual(serializeDecimal(-1.0035), "-1.004")
  assert.deepStrictEqual(serializeDecimal( 999_999_999_999.999),  "999999999999.999")
  assert.deepStrictEqual(serializeDecimal(-999_999_999_999.999), "-999999999999.999")
  assert.throws(() => serializeDecimal( 1_000_000_000_000.0), /failed to serialize "1000000000000" as Decimal/)
  assert.throws(() => serializeDecimal(-1_000_000_000_000.0), /failed to serialize "-1000000000000" as Decimal/)
})

test("test serializeString", () => {
  assert.deepStrictEqual(serializeString("string"),   `"string"`)
  assert.deepStrictEqual(serializeString("str\\ing"), `"str\\\\ing"`)
  assert.deepStrictEqual(serializeString("str\"ing"), `"str\\"ing"`)
  assert.throws(() => serializeString("str\x00ing"), /failed to serialize "str\x00ing" as string/)
  assert.throws(() => serializeString("str\x1fing"), /failed to serialize "str\x1fing" as string/)
  assert.throws(() => serializeString("str\x7fing"), /failed to serialize "str\x7fing" as string/)
})

test("test serializeToken", () => {
  assert.deepStrictEqual(serializeToken(s("token")),  `token`)
  assert.deepStrictEqual(serializeToken(s("*token")),  `*token`)
  assert.deepStrictEqual(serializeToken(s(`to!ken`)), `to!ken`)
  assert.deepStrictEqual(serializeToken(s(`to#ken`)), `to#ken`)
  assert.deepStrictEqual(serializeToken(s(`to$ken`)), `to$ken`)
  assert.deepStrictEqual(serializeToken(s(`to%ken`)), `to%ken`)
  assert.deepStrictEqual(serializeToken(s(`to&ken`)), `to&ken`)
  assert.deepStrictEqual(serializeToken(s(`to'ken`)), `to'ken`)
  assert.deepStrictEqual(serializeToken(s(`to*ken`)), `to*ken`)
  assert.deepStrictEqual(serializeToken(s(`to+ken`)), `to+ken`)
  assert.deepStrictEqual(serializeToken(s(`to-ken`)), `to-ken`)
  assert.deepStrictEqual(serializeToken(s(`to.ken`)), `to.ken`)
  assert.deepStrictEqual(serializeToken(s(`to^ken`)), `to^ken`)
  assert.deepStrictEqual(serializeToken(s(`to_ken`)), `to_ken`)
  assert.deepStrictEqual(serializeToken(s('to`ken')), 'to`ken')
  assert.deepStrictEqual(serializeToken(s(`to|ken`)), `to|ken`)
  assert.deepStrictEqual(serializeToken(s(`to~ken`)), `to~ken`)
  assert.deepStrictEqual(serializeToken(s(`to:ken`)), `to:ken`)
  assert.deepStrictEqual(serializeToken(s(`to/ken`)), `to/ken`)

  assert.throws(() => serializeToken(s(`!token`)), /failed to serialize "\!token" as token/)
  assert.throws(() => serializeToken(s(`#token`)), /failed to serialize "\#token" as token/)
  assert.throws(() => serializeToken(s(`$token`)), /failed to serialize "\$token" as token/)
  assert.throws(() => serializeToken(s(`%token`)), /failed to serialize "\%token" as token/)
  assert.throws(() => serializeToken(s(`&token`)), /failed to serialize "\&token" as token/)
  assert.throws(() => serializeToken(s(`'token`)), /failed to serialize "\'token" as token/)
  assert.throws(() => serializeToken(s(`+token`)), /failed to serialize "\+token" as token/)
  assert.throws(() => serializeToken(s(`-token`)), /failed to serialize "\-token" as token/)
  assert.throws(() => serializeToken(s(`.token`)), /failed to serialize "\.token" as token/)
  assert.throws(() => serializeToken(s(`^token`)), /failed to serialize "\^token" as token/)
  assert.throws(() => serializeToken(s(`_token`)), /failed to serialize "\_token" as token/)
  assert.throws(() => serializeToken(s('`token')), /failed to serialize "\`token" as token/)
  assert.throws(() => serializeToken(s(`|token`)), /failed to serialize "\|token" as token/)
  assert.throws(() => serializeToken(s(`~token`)), /failed to serialize "\~token" as token/)
  assert.throws(() => serializeToken(s(`:token`)), /failed to serialize "\:token" as token/)
  assert.throws(() => serializeToken(s(`/token`)), /failed to serialize "\/token" as token/)

  assert.throws(() => serializeToken(s(`0token`)), /failed to serialize "0token" as token/)
  assert.throws(() => serializeToken(s(`to"ken`)), /failed to serialize "to\"ken" as token/)
  assert.throws(() => serializeToken(s(`to(ken`)), /failed to serialize "to\(ken" as token/)
  assert.throws(() => serializeToken(s(`to)ken`)), /failed to serialize "to\)ken" as token/)
  assert.throws(() => serializeToken(s(`to,ken`)), /failed to serialize "to\,ken" as token/)
  assert.throws(() => serializeToken(s(`to;ken`)), /failed to serialize "to\;ken" as token/)
  assert.throws(() => serializeToken(s(`to<ken`)), /failed to serialize "to\<ken" as token/)
  assert.throws(() => serializeToken(s(`to=ken`)), /failed to serialize "to\=ken" as token/)
  assert.throws(() => serializeToken(s(`to>ken`)), /failed to serialize "to\>ken" as token/)
  assert.throws(() => serializeToken(s(`to?ken`)), /failed to serialize "to\?ken" as token/)
  assert.throws(() => serializeToken(s(`to@ken`)), /failed to serialize "to\@ken" as token/)
  assert.throws(() => serializeToken(s(`to[ken`)), /failed to serialize "to\[ken" as token/)
  assert.throws(() => serializeToken(s(`to\\ken`)), /failed to serialize "to\\ken" as token/)
  assert.throws(() => serializeToken(s(`to]ken`)), /failed to serialize "to\]ken" as token/)
  assert.throws(() => serializeToken(s(`to{ken`)), /failed to serialize "to\{ken" as token/)
  assert.throws(() => serializeToken(s(`to}ken`)), /failed to serialize "to\}ken" as token/)
})

test("test serializeBoolean", () => {
  assert.deepStrictEqual(serializeBoolean(true),  `?1`)
  assert.deepStrictEqual(serializeBoolean(false), `?0`)
  assert.throws(() => serializeBoolean(0),         /failed to serialize "0" as boolean/)
  assert.throws(() => serializeBoolean(null),      /failed to serialize "null" as boolean/)
  assert.throws(() => serializeBoolean(undefined), /failed to serialize "undefined" as boolean/)
})

test("test serializeByteSequence", () => {
  const value = Uint8Array.from([
    112, 114, 101, 116, 101, 110, 100,  32, 116, 104, 105, 115,
     32, 105, 115,  32,  98, 105, 110,  97, 114, 121,  32,  99,
    111, 110, 116, 101, 110, 116, 46
  ])
  assert.deepStrictEqual(serializeByteSequence(value), `:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`)
  assert.throws(() => serializeByteSequence([1,2,3]), /failed to serialize "\[1,2,3\]" as Byte Sequence/)
})

test("test serializeDisplayString", () => {
  assert.deepStrictEqual(serializeDisplayString("foo bar"),            `%"foo bar"`)
  assert.deepStrictEqual(serializeDisplayString("füü"),                `%"f%c3%bc%c3%bc"`)
  assert.deepStrictEqual(serializeDisplayString("foo \"bar\" \\ baz"), `%"foo %22bar%22 \\ baz"`)
})

test("test parseIntegerOrDecimal", () => {
  assert.deepStrictEqual(parseIntegerOrDecimal(`42`),   {value: 42,   input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`-42`),  {value: -42,  input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4.2`),  {value: 4.2,  input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4a`),   {value: 4,    input_string: `a`})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4.5`),  {value: 4.5,  input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`-4.5`), {value: -4.5, input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4.0`),  {value: 4,    input_string: ``})
  assert.throws(() => parseIntegerOrDecimal(`a`),  /failed to parse "a" as Integer or Decimal/)
  assert.throws(() => parseIntegerOrDecimal(`-`),  /failed to parse "-" as Integer or Decimal/)
  assert.throws(() => parseIntegerOrDecimal(`1.`), /failed to parse "1." as Integer or Decimal/)
  assert.throws(() => parseIntegerOrDecimal(``),   /failed to parse "" as Integer or Decimal/)

  // 7.3.1. when decimal and integer length is larger than 12
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`123456789012.1`),
    {value: 123456789012.1, input_string: ``}
  )
    assert.throws(() => parseIntegerOrDecimal(`1234567890123.1`), /failed to parse "1234567890123.1" as Integer or Decimal/)

  // 7.3.5. If type is "integer" and input_number contains more than 15 characters, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`123456789012345`),
    {value: 123456789012345, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`1234567890123456`), /failed to parse "1234567890123456" as Integer or Decimal/)

  // 7.3.6. If type is "decimal" and input_number contains more than 16 characters, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`123456789012.456`),
    {value: 123456789012.456, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`1234567890123.456`),  /failed to parse "1234567890123.456" as Integer or Decimal/)

  // 9.2. If the number of characters after "." in input_number is greater than three, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`0.123`),
    {value: 0.123, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`0.1234`), /failed to parse "0.1234" as Integer or Decimal/)

  // 2. If output_number is outside the range -999,999,999,999,999 to 999,999,999,999,999 inclusive, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`-999999999999999`),
    {value: -999999999999999, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`-999999999999999.1`), /failed to parse "-999999999999999.1" as Integer or Decimal/)
  assert.throws(() => parseIntegerOrDecimal(`-1000000000000000`),  /failed to parse "-1000000000000000" as Integer or Decimal/)

  assert.deepStrictEqual(
    parseIntegerOrDecimal(`999999999999999`),
    {value: 999999999999999, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`999999999999999.1`), /failed to parse "999999999999999.1" as Integer or Decimal/)
  assert.throws(() => parseIntegerOrDecimal(`1000000000000000`),  /failed to parse "1000000000000000" as Integer or Decimal/)
})

test("test parseString", () => {
  assert.deepStrictEqual(parseString(`"asdf"`),   {value: `asdf`, input_string: ``})
  assert.deepStrictEqual(parseString(`"!#[]"`),   {value: `!#[]`, input_string: ``})
  assert.deepStrictEqual(parseString(`"a""`),     {value: `a`,    input_string: `"`})
  assert.deepStrictEqual(parseString(`"a\\\""`),  {value: `a"`,   input_string: ``})
  assert.deepStrictEqual(parseString(`"a\\\\c"`), {value: `a\\c`, input_string: ``})
  assert.throws(() => parseString(`"a\\"`), /failed to parse "\"a\\"\" as String/)
  assert.throws(() => parseString(`"\\a"`), /failed to parse "\"\\a"\" as String/)
  assert.throws(() => parseString(``),      /failed to parse "" as String/)
})

test("test parseToken", () => {
  assert.deepStrictEqual(parseToken(`*foo123/456`),             {value: s(`*foo123/456`),             input_string: ``})
  assert.deepStrictEqual(parseToken(`foo123;456`),              {value: s(`foo123`),                  input_string: `;456`})
  assert.deepStrictEqual(parseToken(`ABC!#$%&'*+-.^_'|~:/012`), {value: s(`ABC!#$%&'*+-.^_'|~:/012`), input_string: ``})
  assert.throws(() => parseToken(``), /failed to parse "" as Token/)
})

test("test parseByteSequence", () => {
  const value = Uint8Array.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepStrictEqual(parseByteSequence(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), {value, input_string: ``})
  assert.throws(() => parseByteSequence(``), /failed to parse "" as Byte Sequence/)
})

test("test parseBoolean", () => {
  assert.deepStrictEqual(parseBoolean(`?0`), {value: false, input_string: ``})
  assert.deepStrictEqual(parseBoolean(`?1`), {value: true,  input_string: ``})
  assert.throws(() => parseBoolean(``), /failed to parse "" as Boolean/)
})

test("test parseDate", () => {
  assert.deepStrictEqual(parseDate(`@1659578233`), {value: new Date(1659578233000), input_string: ``})
  assert.deepStrictEqual(parseDate(`@-1659578233`), {value: new Date('1917-05-30 22:02:47Z'), input_string: ``})
  assert.throws(() => parseDate(``), /failed to parse "" as Date/)
})

test("test parseDisplayString", () => {
  assert.deepStrictEqual(parseDisplayString(`%"foo bar"`), {value: "foo bar", input_string: ``})
  assert.deepStrictEqual(parseDisplayString(`%"f%c3%bc%c3%bc"`), {value: "füü", input_string: ``})
  assert.throws(() => parseDisplayString(``), /failed to parse "" as Display String/)
})

test("test parseList", () => {
  assert.deepStrictEqual(
    parseList(`"foo", "bar", "It was the best of times."`),
    { value: [
      new Item(`foo`),
      new Item(`bar`),
      new Item(`It was the best of times.`)
    ], input_string: ``}
  )
  assert.deepStrictEqual(
    parseList(`foo, bar`),
    { value: [
      new Item(s(`foo`)),
      new Item(s(`bar`)),
    ], input_string: ``}
  )
  assert.deepStrictEqual(
    parseList(`1, 1.23, a, "a", ?1, :AQID:, @1659578233`),
    { value: [
      new Item(1),
      new Item(1.23),
      new Item(s("a")),
      new Item("a"),
      new Item(true),
      new Item(new Uint8Array([1, 2, 3])),
      new Item(new Date(1659578233*1000))
    ], input_string: ``}
  )
  assert.deepStrictEqual(
    parseList(`("foo" "bar"), ("baz"), ("bat" "one"), ()`),
    { value: [
      new InnerList([new Item("foo"), new Item("bar")]),
      new InnerList([new Item("baz")]),
      new InnerList([new Item("bat"), new Item("one")]),
      new InnerList([])
    ], input_string: ``}
  )
  assert.deepStrictEqual(parseList(`("foo";a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), {
    value: [
      new InnerList(
        [new Item("foo", {a: 1, b: 2})],
        { "lvl": 5 }
      ),
      new InnerList(
        [new Item("bar"), new Item("baz")],
        { "lvl": 1 }
      ),
    ], input_string: ``})
  assert.throws(() => parseList(`("aaa").`), /failed to parse "." as List/)
  assert.throws(() => parseList(`("aaa"),`), /failed to parse "" as List/)
})

test("test parseInnerList", () => {
  assert.deepStrictEqual(parseInnerList(`( 1 2 3 )`), {
    value: new InnerList([
      new Item(1),
      new Item(2),
      new Item(3)
    ]),
    input_string: ``
  })
  assert.deepStrictEqual(parseInnerList(`(1)`), {
    value: new InnerList([
      new Item(1)
    ]),
    input_string: ``
  })
  assert.deepStrictEqual(parseInnerList(`()`), {
    value: new InnerList([]),
    input_string: ``
  })
  assert.deepStrictEqual(parseList(`(1 1.23 a "a" ?1 :AQID: @1659578233)`), {
    value: [
      new InnerList([
        new Item(1),
        new Item(1.23),
        new Item(s("a")),
        new Item("a"),
        new Item(true),
        new Item(new Uint8Array([1, 2, 3])),
        new Item(new Date(1659578233*1000))
      ])
    ], input_string: ``}
  )
  assert.throws(() => parseInnerList(`[1 2 3)`), /failed to parse "\[1 2 3\)" as Inner List/)
  assert.throws(() => parseInnerList(`(1 2 3]`), /failed to parse "\]" as Inner List/)
  assert.throws(() => parseInnerList(`(`),       /failed to parse "" as Inner List/)
})

test("test parseDictionary", () => {
  assert.deepStrictEqual(parseDictionary(
    `int=1, dec=1.23, token=a, str="a", bool=?1, bin=:AQID:, date=@1659578233`
  ), {
    value: [
      ["int",   new Item(1)],
      ["dec",   new Item(1.23)],
      ["token", new Item(s("a"))],
      ["str",   new Item("a")],
      ["bool",  new Item(true)],
      ["bin",   new Item(new Uint8Array([1, 2, 3]))],
      ["date",  new Item(new Date(1659578233*1000))]
    ],
    input_string: ``
  })

  assert.deepEqual(parseDictionary(`a=?0, b, c; foo=bar`), {
    value: [
      ["a", new Item(false)],
      ["b", new Item(true)],
      ["c", new Item(true, { "foo": s("bar")})],
    ],
    input_string: ``
  })

  assert.deepStrictEqual(parseDictionary(`rating=1.5, feelings=(joy sadness)`), {
    value: [
      ["rating",   new Item(1.5)],
      ["feelings", new InnerList([
          new Item(s("joy")),
          new Item(s("sadness"))
        ])
      ]
    ],
    input_string:``
  })

  assert.deepStrictEqual(parseDictionary(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {
    value: [
      ["a", new InnerList([new Item(1), new Item(2)])],
      ["b", new Item(3)],
      ["c", new Item(4, { "aa": s("bb") })],
      ["d", new InnerList([new Item(5), new Item(6)], { "valid": true })]
    ],
    input_string: ``
  })

  assert.throws(() => parseDictionary(`a=1&`), /failed to parse "&" as Dict/)
  assert.throws(() => parseDictionary(`a=1,`), /failed to parse "" as Dict/)
})

test("test parseItem", () => {
  assert.deepStrictEqual(parseItem(`123;a=1;b`), {value: new Item(123, {"a":1, "b":true}), input_string: ``})
  assert.throws(() => parseItem(``), /failed to parse "" as Token/)
})

test("test bareItem", () => {
  assert.deepStrictEqual(parseBareItem(`"string"`),   {value: "string",    input_string: ``})
  assert.deepStrictEqual(parseBareItem(`123`),        {value: 123,         input_string: ``})
  assert.deepStrictEqual(parseBareItem(`3.14`),       {value: 3.14,        input_string: ``})
  assert.deepStrictEqual(parseBareItem(`?1`),         {value: true,     input_string: ``})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepStrictEqual(parseBareItem(`:${base64encode(binary)}:`), {value: binary, input_string: ``})
  assert.deepStrictEqual(parseBareItem(`token`),      {value: s(`token`), input_string: ``})
  assert.deepStrictEqual(parseBareItem(`foo123;456`), {value: s(`foo123`), input_string: `;456`})
  assert.deepStrictEqual(parseBareItem(`@1659578233`), {value: new Date(1659578233000), input_string: ``})
  assert.throws(() => parseBareItem(`&`), /failed to parse "&" as Bare Item/)
})

test("test parseParameters", () => {
  assert.deepStrictEqual(parseParameters(`;a=0`),         {value: {"a": 0},                         input_string: ``})
  assert.deepStrictEqual(parseParameters(`;a`),           {value: {"a": true},                      input_string: ``})
  assert.deepStrictEqual(parseParameters(`;  a;  b=?0`),  {value: {"a": true, "b": false},          input_string: ``})
  assert.deepStrictEqual(parseParameters(`;a;b=?0;c=10`), {value: {"a": true, "b": false, "c": 10}, input_string: ``})
})

test("test parseKey", () => {
  assert.deepStrictEqual(parseKey(`a123_-.*`), {value: `a123_-.*`, input_string: ``})
  assert.deepStrictEqual(parseKey(`*a123`),    {value: `*a123`,    input_string: ``})
  assert.throws(() => parseKey(`&`), /failed to parse "&" as Key/)
})

test("structured_field_tests", async (t) => {
  const files = [
    `binary`,
    `boolean`,
    `date`,
    `number`,
    `number-generated`,
    `string`,
    `string-generated`,
    `list`,
    `listlist`,
    `token`,
    `token-generated`,
    `large-generated`,
    `item`,
    `dictionary`,
    `examples`,
    `key-generated`,
    `param-dict`,
    `param-list`,
    `param-listlist`,
  ]

  for (const file of files) {
    await t.test(file, async (t) => {
      for (const suite of read(t.name)) {
        await t.test(suite.name, (t) => {
          // SKIP tests -----
          let DECODE_ONLY = false
          if (suite.raw.length > 1) {
            return t.skip(`not support multiline header`)
          }
          if (file === `number` && suite.name === `negative zero`) {
            return t.skip("0 and -0 is difference in JS")
          }
          if (file === `string` && suite.name === `non-ascii string`) {
            return t.skip(`non-ascii string will be encoded as Display String`)
          }
          if (file === `number-generated`) {
            if ([
              `2 digit, 1 fractional 0 decimal`,
              `3 digit, 2 fractional 0 decimal`,
              `4 digit, 3 fractional 0 decimal`,
              `3 digit, 1 fractional 0 decimal`,
              `4 digit, 2 fractional 0 decimal`,
              `5 digit, 3 fractional 0 decimal`,
              `4 digit, 1 fractional 0 decimal`,
              `5 digit, 2 fractional 0 decimal`,
              `6 digit, 3 fractional 0 decimal`,
              `5 digit, 1 fractional 0 decimal`,
              `6 digit, 2 fractional 0 decimal`,
              `7 digit, 3 fractional 0 decimal`,
              `6 digit, 1 fractional 0 decimal`,
              `7 digit, 2 fractional 0 decimal`,
              `8 digit, 3 fractional 0 decimal`,
              `7 digit, 1 fractional 0 decimal`,
              `8 digit, 2 fractional 0 decimal`,
              `9 digit, 3 fractional 0 decimal`,
              `8 digit, 1 fractional 0 decimal`,
              `9 digit, 2 fractional 0 decimal`,
              `10 digit, 3 fractional 0 decimal`,
              `9 digit, 1 fractional 0 decimal`,
              `10 digit, 2 fractional 0 decimal`,
              `11 digit, 3 fractional 0 decimal`,
              `10 digit, 1 fractional 0 decimal`,
              `11 digit, 2 fractional 0 decimal`,
              `12 digit, 3 fractional 0 decimal`,
              `11 digit, 1 fractional 0 decimal`,
              `12 digit, 2 fractional 0 decimal`,
              `13 digit, 3 fractional 0 decimal`,
              `12 digit, 1 fractional 0 decimal`,
              `13 digit, 2 fractional 0 decimal`,
              `14 digit, 3 fractional 0 decimal`,
              `13 digit, 1 fractional 0 decimal`,
              `14 digit, 2 fractional 0 decimal`,
              `15 digit, 3 fractional 0 decimal`,
            ].includes(suite.name)) {
              // 1.0" is "1" in JS
              DECODE_ONLY = true
            }
          }
          if (file === `param-dict`) {
            if ([
              `single item parameterised dict`,
              `list item parameterised dictionary`
            ].includes(suite.name)) {
              // 1.0" is "1" in JS
              DECODE_ONLY = true
            }
          }
          if (file === `param-list`) {
            if ([
              `single item parameterised list`,
              `missing parameter value parameterised list`,
              `missing terminal parameter value parameterised list`,
            ].includes(suite.name)) {
              // 1.0" is "1" in JS
              DECODE_ONLY = true
            }
          }
          // SKIP tests -----

          if (suite.header_type === `item`) {
            const raw = suite.raw[0]
            if (suite.must_fail) {
              return assert.throws(() => decodeItem(raw), /failed to parse/)
            }
            const item = formatItem(suite.expected)
            assert.deepStrictEqual(decodeItem(raw), item, suite.name)

            if (DECODE_ONLY) return

            if (suite.canonical) {
              const canonical = suite.canonical[0]
              assert.deepStrictEqual(encodeItem(item), canonical, suite.name)
            } else {
              assert.deepStrictEqual(encodeItem(item), raw, suite.name)
            }
            return
          }

          if (suite.header_type === `list`) {
            const raw = suite.raw[0]
            if (suite.must_fail) {
              return assert.throws(() => decodeList(raw), /failed to parse/)
            }
            const list = formatList(suite.expected)
            assert.deepStrictEqual(decodeList(raw), list, suite.name)

            if (DECODE_ONLY) return

            if (suite.canonical) {
              const canonical = suite.canonical[0] || ``
              assert.deepStrictEqual(encodeList(list), canonical, suite.name)
            } else {
              assert.deepStrictEqual(encodeList(list), raw, suite.name)
            }
            return
          }

          if (suite.header_type === "dictionary") {
            const raw = suite.raw[0]
            if (suite.must_fail) {
              return assert.throws(() => decodeDict(raw), /failed to parse/)
            }
            const dict = formatDict(suite.expected)
            assert.deepStrictEqual(decodeDict(raw), dict, suite.name)

            if (DECODE_ONLY) return

            if (suite.canonical) {
              const canonical = suite.canonical[0] || ``
              assert.deepStrictEqual(encodeDict(dict), canonical, suite.name)
            } else {
              assert.deepStrictEqual(encodeDict(dict), raw, suite.name)
            }
            return
          }

          assert.fail("unreachable")
        })
      }
    })
  }
})

test("serialisation_tests", async (t) => {
  const files = [
    "serialisation-tests/number",
    "serialisation-tests/token-generated",
    "serialisation-tests/string-generated",
    "serialisation-tests/key-generated"
  ]

  for (const file of files) {
    await t.test(file, async (t) => {
      for (const suite of read(t.name)) {
        await t.test(suite.name, () => {
          if (suite.header_type === "item") {
            const item = formatItem(suite.expected)
            if (suite.must_fail) {
              return assert.throws(() => encodeItem(item), /failed to serialize/)
            }
            return assert.deepStrictEqual(suite.canonical[0], encodeItem(item), suite.name)
          }

          if (suite.header_type === "dictionary") {
            const dict = formatDict(suite.expected)
            if (suite.must_fail) {
              return assert.throws(() => encodeDict(dict), /failed to serialize/)
            }
            return assert.deepStrictEqual(suite.canonical[0], encodeDict(dict), suite.name)
          }
           
          if (suite.header_type === "list") {
            const list = formatList(suite.expected)
            if (suite.must_fail) {
              return assert.throws(() => encodeList(list), /failed to serialize/)
            }
            return assert.deepStrictEqual(suite.canonical[0], encodeList(list), suite.name)
          }

          assert.fail("unreachable")
        })
      }
    })
  }
})

test("doc-testing", ONLY, async (t) => {
  const readme = readFileSync(`./README.md`).toString()
  const codes = Array
    .from(readme.matchAll(/```js(?<code>[\s\S]*?)```/gm))
    .map((match) => match.groups.code.trim())

  codes.forEach((code) => eval(code))
})