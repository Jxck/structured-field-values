import assert from "assert"

import {
  encodeItem,
  encodeList,
  encodeDict,
  decodeItem,
  decodeList,
  decodeDict,
  base64decode,
  base64encode,
} from "./index.js"

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
  assert.deepStrictEqual(sf_token()(`*foo123/456`),             {ok, value: s(`*foo123/456`),             rest: ``})
  assert.deepStrictEqual(sf_token()(`foo123;456`),              {ok, value: s(`foo123`),                  rest: `;456`})
  assert.deepStrictEqual(sf_token()(`ABC!#$%&'*+-.^_'|~:/012`), {ok, value: s(`ABC!#$%&'*+-.^_'|~:/012`), rest: ``})
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
}

function test_repeat_list_member() {
  // omit
}

function test_list_member() {
  // test_sf_item / test_inner_list
}

function test_inner_list() {
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
}

function test_optional_inner_item() {
  // omit
}

function test_repeat_inner_item() {
  // omit
}

function test_sf_dictionary() {
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
}

function test_repeat_dict_member() {
  // omit
}

function test_dict_member() {
  // omit
}

function test_member_value() {
  // test_sf_item / test_inner_list
}

function test_sf_item() {
  assert.deepStrictEqual(sf_item()(`123;a=1;b`), {ok, value: {value: 123, params: {"a":1, "b":true}}, rest: ``})
  assert.deepStrictEqual(sf_item()(``),          {ok: false, rest: ``})
}

function test_bare_item() {
  assert.deepStrictEqual(bare_item()(`123`),        {ok, value: 123,         rest: ``})
  assert.deepStrictEqual(bare_item()(`3.14`),       {ok, value: 3.14,        rest: ``})
  assert.deepStrictEqual(bare_item()(`string`),     {ok, value: s(`string`), rest: ``})
  assert.deepStrictEqual(bare_item()(`string`),     {ok, value: s(`string`), rest: ``})
  assert.deepStrictEqual(bare_item()(`foo123;456`), {ok, value: s(`foo123`), rest: `;456`})
  const binary = new Uint8Array([1,2,3,4,5])
  assert.deepStrictEqual(bare_item()(`:${base64encode(binary)}:`), {ok, value: binary, rest: ``})
  assert.deepStrictEqual(bare_item()(`?1`),         {ok, value: true,     rest: ``})
}

function test_parameters() {
  assert.deepStrictEqual(parameters()(`;a=0`),         {ok, value: {"a": 0},                         rest: ``})
  assert.deepStrictEqual(parameters()(`;a`),           {ok, value: {"a": true},                      rest: ``})
  assert.deepStrictEqual(parameters()(`;  a;  b=?0`),  {ok, value: {"a": true, "b": false},          rest: ``})
  assert.deepStrictEqual(parameters()(`;a;b=?0;c=10`), {ok, value: {"a": true, "b": false, "c": 10}, rest: ``})
}

function test_parameter() {
  assert.deepStrictEqual(parameter()(`a`),    {ok, value: [`a`, true],  rest: ``})
  assert.deepStrictEqual(parameter()(`b=?0`), {ok, value: [`b`, false], rest: ``})
  assert.deepStrictEqual(parameter()(`c=10`), {ok, value: [`c`, 10],    rest: ``})
  assert.deepStrictEqual(parameter()(``),     {ok: false, rest: ``})
}

function test_sf_key() {
  assert.deepStrictEqual(sf_key()(`a123_-.*`), {ok, value: `a123_-.*`, rest: ``})
  assert.deepStrictEqual(sf_key()(`*a123`),    {ok, value: `*a123`,    rest: ``})
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
      // ...read(`number-generated`),
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

      console.log(suite.name)

      try {
        if (suite.header_type === `item`) {
          // decode
          const obj     = formatItem(suite.expected)
          const decoded = decodeItem(suite.raw[0])
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
  })();
}

structured_field_tests()
