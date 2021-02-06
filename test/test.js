import assert from "assert"

import {
  Item,

  encodeItem,
  encodeList,
  encodeDict,
  decodeItem,
  decodeList,
  decodeDict,

  serializeList,
  serializeInnerList,
  serializeParams,
  serializeKey,
  serializeDict,
  serializeItem,
  serializeBareItem,
  serializeInteger,
  serializeDecimal,
  serializeString,
  serializeToken,
  serializeBoolean,
  serializeByteSequence,

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

function test_serializeKey() {
  assert.deepStrictEqual(serializeKey(`a`), "a")
  assert.deepStrictEqual(serializeKey(`*`), "*")
  assert.deepStrictEqual(serializeKey(`*-_.*`), "*-_.*")
  assert.deepStrictEqual(serializeKey(`****`), "****")
  assert.deepStrictEqual(serializeKey(`a*`), "a*")
  assert.deepStrictEqual(serializeKey(`a*0-_.*`), "a*0-_.*")
  assert.throws(() => serializeKey(`#`))
  assert.throws(() => serializeKey(`?`))
}

function test_serializeBareItem() {
  assert.throws(() => serializeBareItem([]))
  assert.throws(() => serializeBareItem({}))
}

function test_serializeInteger() {
  assert.deepStrictEqual(serializeInteger(0), "0")
  assert.deepStrictEqual(serializeInteger(1), "1")
  assert.deepStrictEqual(serializeInteger(-1), "-1")
  assert.deepStrictEqual(serializeInteger( 999_999_999_999_999),  "999999999999999")
  assert.deepStrictEqual(serializeInteger(-999_999_999_999_999), "-999999999999999")
  assert.throws(() => serializeInteger( 1_000_000_000_000_000))
  assert.throws(() => serializeInteger(-1_000_000_000_000_000))
}

function test_serializeDecimal() {
  assert.deepStrictEqual(serializeDecimal(0), "0.0")
  assert.deepStrictEqual(serializeDecimal(1.0), "1.0")
  assert.deepStrictEqual(serializeDecimal(1.01), "1.01")
  assert.deepStrictEqual(serializeDecimal(1.0021), "1.002")
  assert.deepStrictEqual(serializeDecimal(1.0029), "1.003")
  assert.deepStrictEqual(serializeDecimal(1.0025), "1.002")
  assert.deepStrictEqual(serializeDecimal(1.0035), "1.004")
  assert.deepStrictEqual(serializeDecimal(-1.0035), "-1.004")
  assert.deepStrictEqual(serializeDecimal( 999_999_999_999.999),  "999999999999.999")
  assert.deepStrictEqual(serializeDecimal(-999_999_999_999.999), "-999999999999.999")
  assert.throws(() => serializeDecimal( 1_000_000_000_000.0))
  assert.throws(() => serializeDecimal(-1_000_000_000_000.0))
}

function test_serializeString() {
  assert.deepStrictEqual(serializeString("string"), `"string"`)
  assert.deepStrictEqual(serializeString("str\\ing"), `"str\\\\ing"`)
  assert.deepStrictEqual(serializeString("str\"ing"), `"str\\"ing"`)
  assert.throws(() => serializeString("str\x00ing"))
  assert.throws(() => serializeString("str\x1fing"))
  assert.throws(() => serializeString("str\x7fing"))
}

function test_serializeToken() {
  assert.deepStrictEqual(serializeToken(s("token")),  `token`)

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
  assert.deepStrictEqual(serializeToken(s(`towken`)), `towken`)
  assert.deepStrictEqual(serializeToken(s(`to:ken`)), `to:ken`)
  assert.deepStrictEqual(serializeToken(s(`to/ken`)), `to/ken`)

  assert.throws(() => serializeToken(s(`to"ken`)))
  assert.throws(() => serializeToken(s(`to(ken`)))
  assert.throws(() => serializeToken(s(`to)ken`)))
  assert.throws(() => serializeToken(s(`to,ken`)))
  assert.throws(() => serializeToken(s(`to;ken`)))
  assert.throws(() => serializeToken(s(`to<ken`)))
  assert.throws(() => serializeToken(s(`to=ken`)))
  assert.throws(() => serializeToken(s(`to>ken`)))
  assert.throws(() => serializeToken(s(`to?ken`)))
  assert.throws(() => serializeToken(s(`to@ken`)))
  assert.throws(() => serializeToken(s(`to[ken`)))
  assert.throws(() => serializeToken(s(`to\\ken`)))
  assert.throws(() => serializeToken(s(`to]ken`)))
  assert.throws(() => serializeToken(s(`to{ken`)))
  assert.throws(() => serializeToken(s(`to}ken`)))
}

function test_serializeBoolean() {
  assert.deepStrictEqual(serializeBoolean(true),  `?1`)
  assert.deepStrictEqual(serializeBoolean(false), `?0`)
  assert.throws(() => serializeBoolean(0))
  assert.throws(() => serializeBoolean(null))
  assert.throws(() => serializeBoolean(undefined))
}

function test_serializeByteSequence() {
  const value = Uint8Array.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepStrictEqual(serializeByteSequence(value), `:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`)
  assert.throws(() => serializeByteSequence([1,2,3]))
}

function test_decode() {
  assert.throws(() => decodeItem(`1;`))
  assert.throws(() => decodeList(`1,2,3)`))
  assert.throws(() => decodeDiect(`a=1, b=2)`))
}

function test_parseIntegerOrDecimal() {
  assert.deepStrictEqual(parseIntegerOrDecimal(`42`),   {value: 42,   input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`-42`),  {value: -42,  input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4.2`),  {value: 4.2,  input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4a`),   {value: 4,    input_string: `a`})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4.5`),  {value: 4.5,  input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`-4.5`), {value: -4.5, input_string: ``})
  assert.deepStrictEqual(parseIntegerOrDecimal(`4.0`),  {value: 4,    input_string: ``})
  assert.throws(() => parseIntegerOrDecimal(`a`))
  assert.throws(() => parseIntegerOrDecimal(`-`))
  assert.throws(() => parseIntegerOrDecimal(`1.`))
  assert.throws(() => parseIntegerOrDecimal(``))

  // 7.3.1. when decimal and integer length is larger than 12
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`123456789012.1`),
    {value: 123456789012.1, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`1234567890123.1`))

  // 7.3.5. If type is "integer" and input_number contains more than 15 characters, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`123456789012345`),
    {value: 123456789012345, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`1234567890123456`))

  // 7.3.6. If type is "decimal" and input_number contains more than 16 characters, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`123456789012.456`),
    {value: 123456789012.456, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`1234567890123.456`))


  // 9.2. If the number of characters after "." in input_number is greater than three, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`0.123`),
    {value: 0.123, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`0.1234`))


  // 2. If output_number is outside the range -999,999,999,999,999 to 999,999,999,999,999 inclusive, fail parsing.
  assert.deepStrictEqual(
    parseIntegerOrDecimal(`-999999999999999`),
    {value: -999999999999999, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`-999999999999999.1`))
  assert.throws(() => parseIntegerOrDecimal(`-1000000000000000`))

  assert.deepStrictEqual(
    parseIntegerOrDecimal(`999999999999999`),
    {value: 999999999999999, input_string: ``}
  )
  assert.throws(() => parseIntegerOrDecimal(`999999999999999.1`))
  assert.throws(() => parseIntegerOrDecimal(`1000000000000000`))
}

function test_parseString() {
  assert.deepStrictEqual(parseString(`"asdf"`),   {value: `asdf`, input_string: ``})
  assert.deepStrictEqual(parseString(`"!#[]"`),   {value: `!#[]`, input_string: ``})
  assert.deepStrictEqual(parseString(`"a""`),     {value: `a`,    input_string: `"`})
  assert.deepStrictEqual(parseString(`"a\\\""`),  {value: `a"`,   input_string: ``})
  assert.deepStrictEqual(parseString(`"a\\\\c"`), {value: `a\\c`, input_string: ``})
  assert.throws(() => parseString(`"a\\"`))
  assert.throws(() => parseString(`"\\a"`))
  assert.throws(() => parseString(``))
}

function test_parseToken() {
  assert.deepStrictEqual(parseToken(`*foo123/456`),             {value: s(`*foo123/456`),             input_string: ``})
  assert.deepStrictEqual(parseToken(`foo123;456`),              {value: s(`foo123`),                  input_string: `;456`})
  assert.deepStrictEqual(parseToken(`ABC!#$%&'*+-.^_'|~:/012`), {value: s(`ABC!#$%&'*+-.^_'|~:/012`), input_string: ``})
  assert.throws(() => parsetoken(``))
}

function test_parseByteSequence() {
  const value = Uint8Array.from([
    112, 114, 101, 116, 101, 110, 100, 32, 116, 104, 105, 115, 32,
    105, 115, 32, 98, 105, 110, 97, 114, 121, 32, 99, 111, 110, 116,
    101, 110, 116, 46
  ])
  assert.deepStrictEqual(parseByteSequence(`:cHJldGVuZCB0aGlzIGlzIGJpbmFyeSBjb250ZW50Lg==:`), {value, input_string: ``})
  assert.throws(() => parseByteSequence(``))
}

function test_parseBoolean() {
  assert.deepStrictEqual(parseBoolean(`?0`), {value: false, input_string: ``})
  assert.deepStrictEqual(parseBoolean(`?1`), {value: true,  input_string: ``})
  assert.throws(() => parseBoolean(``))
}

function test_parseList() {
  assert.deepStrictEqual(
    parseList(`"foo", "bar", "It was the best of times."`),
    { value: [
      { value: `foo`, params: null },
      { value: `bar`, params: null },
      { value: `It was the best of times.`, params: null }
    ], input_string: ``}
  )
  assert.deepStrictEqual(
    parseList(`foo, bar`),
    { value: [
      { value: s(`foo`), params: null },
      { value: s(`bar`), params: null },
    ], input_string: ``}
  )
  assert.deepStrictEqual(
    parseList(`("foo" "bar"), ("baz"), ("bat" "one"), ()`),
    { value: [
      {
        value: [
          { value: "foo", params: null },
          { value: "bar", params: null }
        ],
        params: null
      },
      {
        value: [
          { value: "baz", params: null }
        ],
        params: null
      },
      {
        value: [
          { value: "bat", params: null },
          { value: "one", params: null }
        ],
        params: null
      },
      {
        value: [],
        params: null
      }
    ], input_string: ``}
  )
  assert.deepStrictEqual(parseList(`("foo"; a=1;b=2);lvl=5, ("bar" "baz");lvl=1`), {value: [
    {
      value: [
        { value: "foo", params: { "a": 1, "b": 2 } }
      ],
      params: { "lvl": 5 }
    },
    {
      value: [
        { value: "bar", params: null },
        { value: "baz", params: null }
      ],
      params: { "lvl": 1 }
    }
  ], input_string: ``})
}

function test_parseInnerList() {
  assert.deepStrictEqual(parseInnerList(`( 1 2 3 )`), {
    value: {
      value: [
        { value: 1, params: null },
        { value: 2, params: null },
        { value: 3, params: null }
      ],
      params: null
    },
    input_string: ``})
  assert.deepStrictEqual(parseInnerList(`(1)`), {
    value: {
      value: [
        { value: 1, params: null },
      ],
      params: null
    },
    input_string: ``})
  assert.deepStrictEqual(parseInnerList(`()`), {
    value: {
      value: [],
      params: null
    },
    input_string: ``})
}

function test_parseDictionary() {
  assert.deepStrictEqual(parseDictionary(`en="Applepie", da=:w4ZibGV0w6ZydGU=:`), {
    value: {
      "en": { value: `Applepie`, params: null },
      "da": { value: new Uint8Array([195,134,98,108,101,116,195,166,114,116,101]), params: null }
    },
    input_string: ``
  })

  assert.deepEqual(parseDictionary(`a=?0, b, c; foo=bar`), {
    value: {
      "a": { value: false, params: null },
      "b": { value: true,  params: null },
      "c": { value: true,  params: { "foo": s("bar") } }
    },
    input_string: ``
  })

  assert.deepStrictEqual(parseDictionary(`rating=1.5, feelings=(joy sadness)`), {
    value: {
      "rating": { value: 1.5, params: null },
      "feelings": {
        value: [
          { value: s("joy"),     params: null },
          { value: s("sadness"), params: null }
        ],
        params: null
      }
    },
    input_string:``
  })

  assert.deepStrictEqual(parseDictionary(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`), {
    value: {
      "a": {
        value: [
          { value: 1, params: null },
          { value: 2, params: null }
        ],
        params: null
      },
      "b": {
        value: 3,
        params: null,
      },
      "c": {
        value: 4,
        params: { "aa": s("bb") },
      },
      "d": {
        value: [
          { value: 5, params: null },
          { value: 6, params: null }
        ],
        params: { "valid": true }
      },
    },
    input_string: ``
  })
}

function test_parseItem() {
  assert.deepStrictEqual(parseItem(`123;a=1;b`), {value: {value: 123, params: {"a":1, "b":true}}, input_string: ``})
  assert.throws(() => parseItem(``))
}

function test_bareItem() {
  assert.deepStrictEqual(parseBareItem(`123`),        {value: 123,         input_string: ``})
  assert.deepStrictEqual(parseBareItem(`3.14`),       {value: 3.14,        input_string: ``})
  assert.deepStrictEqual(parseBareItem(`string`),     {value: s(`string`), input_string: ``})
  assert.deepStrictEqual(parseBareItem(`string`),     {value: s(`string`), input_string: ``})
  assert.deepStrictEqual(parseBareItem(`foo123;456`), {value: s(`foo123`), input_string: `;456`})
  assert.deepStrictEqual(parseBareItem(`?1`),         {value: true,     input_string: ``})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepStrictEqual(parseBareItem(`:${base64encode(binary)}:`), {value: binary, input_string: ``})
}

function test_parseParameters() {
  assert.deepStrictEqual(parseParameters(`;a=0`),         {value: {"a": 0},                         input_string: ``})
  assert.deepStrictEqual(parseParameters(`;a`),           {value: {"a": true},                      input_string: ``})
  assert.deepStrictEqual(parseParameters(`;  a;  b=?0`),  {value: {"a": true, "b": false},          input_string: ``})
  assert.deepStrictEqual(parseParameters(`;a;b=?0;c=10`), {value: {"a": true, "b": false, "c": 10}, input_string: ``})
}

function test_parseKey() {
  assert.deepStrictEqual(parseKey(`a123_-.*`), {value: `a123_-.*`, input_string: ``})
  assert.deepStrictEqual(parseKey(`*a123`),    {value: `*a123`,    input_string: ``})
}

function structured_field_tests() {
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
    ...read(`number`),
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
      // number.json
      `negative zero`, // -0 & +0 are no equal in deepStrictEqual
      // list.json
      `two line list`,
      // dictionary.json
      `two lines dictionary`,
      // param-dict.json
      `two lines parameterised list`,
      // example.json
      `Example-Hdr (list on two lines)`,
      `Example-Hdr (dictionary on two lines)`,
    ]
    if (ignore.includes(suite.name)) return
    if (suite.name.endsWith("0 decimal")) return // .0 is Integer in JS

    console.debug(suite.name)
    try {
      if (suite.header_type === `item`) {
        // decode
        const obj     = formatItem(suite.expected)
        const decoded = decodeItem(suite.raw[0])
        console.dir(decoded)
        assert.deepStrictEqual(decoded, obj, suite.name)

        // encode
        const str     = suite?.canonical?.[0] || suite.raw[0]
        const encoded = encodeItem(obj)
        assert.deepStrictEqual(str, encoded, suite.name)
      }
      if (suite.header_type === `list`) {
        // decode
        const obj     = formatList(suite.expected)
        const decoded = decodeList(suite.raw[0])
        assert.deepStrictEqual(decoded, obj, suite.name)

        // encode
        if ([
          // 1.0 is 1 in JS
          `single item parameterised list`,
          `missing parameter value parameterised list`,
          `missing terminal parameter value parameterised list`,
        ].includes(suite.name)) return
        const str     = suite?.canonical?.[0] || suite.raw[0]
        const encoded = encodeList(obj)
        assert.deepStrictEqual(str, encoded, suite.name)
      }
      if (suite.header_type === `dictionary`) {
        // decode
        const obj     = formatDict(suite.expected)
        const decoded = decodeDict(suite.raw[0])
        assert.deepStrictEqual(decoded, obj, suite.name)

        // encode
        if ([
          // 1.0 is 1 in JS
          `single item parameterised dict`,
          `list item parameterised dictionary`,
        ].includes(suite.name)) return
        const str     = suite?.canonical?.[0] || suite.raw[0]
        const encoded = encodeDict(obj)
        assert.deepStrictEqual(str, encoded, suite.name)
      }
    } catch(err) {
      assert.deepStrictEqual(suite.must_fail, true, err)
    }
  })
}

function serialisation_tests() {
  const suites = [
    ...read("serialisation-tests/key-generated"),
    ...read("serialisation-tests/number"),
    ...read("serialisation-tests/string-generated"),
    ...read("serialisation-tests/token-generated"),
  ]

  suites.forEach((suite) => {
    console.debug(suite.name)
    try {
      if (suite.header_type === `item`) {
        // encode
        const obj     = formatItem(suite.expected)
        const encoded = encodeItem(obj)
        const str     = suite.canonical[0]
        assert.deepStrictEqual(str, encoded, suite.name)
      }
    } catch(err) {
      assert.deepStrictEqual(suite.must_fail, true, err)
    }
  })
}

;[
  test_serializeKey,
  test_serializeBareItem,
  test_serializeInteger,
  test_serializeDecimal,
  test_serializeString,
  test_serializeToken,
  test_serializeBoolean,
  test_serializeByteSequence,

  test_decode,
  test_parseIntegerOrDecimal,
  test_parseString,
  test_parseToken,
  test_parseByteSequence,
  test_parseBoolean,
  test_parseList,
  test_parseInnerList,
  test_parseDictionary,
  test_parseItem,
  test_bareItem,
  test_parseParameters,
  test_parseKey,

  structured_field_tests,
  serialisation_tests,
].forEach((t) => {
  console.log(t.name)
  t()
});

