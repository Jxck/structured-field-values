`use strict`;
const fs = require("fs");

const ok = true

/////////////////////////
// public interface
/////////////////////////
function decodeItem(value) { return parseItem(value) }
function decodeList(value) { return parseList(value) }
function decodeDict(value) { return parseDict(value) }
function encodeItem(value) { return serializeItem(value) }
function encodeList(value) { return serializeList(value) }
function encodeDict(value) { return serializeDict(value) }


function parseItem(value) {
  // trim leading/trailing space
  // https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19#section-4.2
  const result = sf_item()(value.trim())
  if (result.ok === false) {
    throw new Error(`failed to parse`)
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}

function parseList(value) {
  // return if empty
  // https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19#section-4.2.1
  if (value === ``) return []

  const result = sf_list()(value.trim())
  if (result.ok === false) {
    throw new Error(`failed to parse`)
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}

function parseDict(value) {
  // return if empty
  // https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19#section-4.2.1
  if (value === ``) return {}

  const result = sf_dictionary()(value.trim())
  if (result.ok === false) {
    throw new Error(`failed to parse`)
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}

function encodeItem(value) {
}

function encodeList(value) {
}

function encodeDict(value) {
}

/////////////////////////
// BFN utility
/////////////////////////

// a => token(/^a/)
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

// (a / b) => alt([a(), b()])
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

// (a b c) => list([a(), b(), c()])
function list(fns) {
  return (rest) => {
    const value = []
    const orig  = rest
    for (let i = 0; i < fns.length; i ++) {
      const result = fns[i](rest)
      if (result.ok === false) {
        return {ok: false, rest: orig}
      }
      value.push(result.value)
      rest = result.rest
    }
    return {ok, value, rest}
  }
}

// *(a b) => repeat(0, Infinity, list([a(), b()]))
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

    if (value.length < min) {
      return {ok: false, rest: orig}
    } else {
      return {ok, value, rest}
    }
  }
}

/////////////////////////
// base64 uility
/////////////////////////
function base64decode(str) {
  if (typeof window === `undefined`) {
    return Uint8Array.from(Buffer.from(str, `base64`))
  } else {
    return new Uint8Array([...atob(str)].map(a => a.charCodeAt(0)));
  }
}

function base64encode(binary) {
  if (typeof window === `undefined`) {
    return Buffer.from(binary).toString(`base64`)
  } else {
    // TODO: browser base64
  }
}


/////////////////////////
// BNF in spec
/////////////////////////

// sf-integer
//       = ["-"] 1*15DIGIT
function sf_integer() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,15}/)(rest)
    if (result.ok) {
      return {ok, value: parseInt(result.value), rest: result.rest}
    }
    return {ok: false, rest}
  }
}

// sf-decimal
//       = ["-"] 1*12DIGIT "." 1*3DIGIT
function sf_decimal() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,12}\.\d{1,3}/)(rest)
    if (result.ok) {
      return {ok, value: parseFloat(result.value), rest: result.rest}
    }
    return {ok: false, rest}
  }
}

// sf-string
//       = DQUOTE *chr DQUOTE
function sf_string() {
  return function(rest) {
    const fn = list([
      token(/^"/),
      repeat(0, 1024, char()),
      token(/^"/),
    ])
    const result = fn(rest)
    if (result.ok) {
      // ['"', ['a', 'b', 'c'], '"'] => "abc"
      result.value = result.value[1].join(``)
      return result
    } else {
      return result
    }
  }
}

// chr
//       = unescaped
//       / escaped
function char() {
  return alt([
    escaped(),
    unescaped(),
  ])
}

// unescaped
//       = %x20-21  (x22 is ")
//       / %x23-5B  (x5c is \)
//       / %x5D-7E
function unescaped() {
  return token(/^([\x20-\x21\x23-\x5B\x5D-\x7E])/)
}

// escaped
//       = "\" ( DQUOTE / "\" )
function escaped() {
  return (rest) => {
    const result = token(/^((\\\")|(\\\\))/)(rest)
    if (result.ok) {
      // unescape (\\" => ",  \\\\ => \\)
      result.value = (result.value === `\\"`) ? `"` : `\\`
    }
    return result
  }
}

// sf-token
//       = ( ALPHA / "*" ) *( tchar / ":" / "/" )
function sf_token() {
  return token(/^([a-zA-Z\*])([\!\#\$\%\&\'\*\+\-\.\^\_\`\|\~\w\:\/]){0,512}/)
}

// sf-binary
//       = ":" *(base64) ":"
// base64
//       = ALPHA
//       / DIGIT
//       / "+"
//       / "/"
//       / "="
function sf_binary() {
  return (rest) => {
    const result = list([
      token(/^:/),
      token(/^([\w+/=]){0,16384}/), // base64
      token(/^:/),
    ])(rest)

    if (result.ok) {
      // [":", "base64str", ":"] => Uint8Array
      result.value = base64decode(result.value[1]) // remove ":"
    }
    return result
  }
}

// sf-boolean
//       = "?" boolean
// boolean
//       = "0"
//       / "1"
function sf_boolean() {
  return (rest) => {
    const result = token(/^((\?0)|(\?1))/)(rest)
    if (result.ok) {
      // ?1 => true, ?0 => false
      result.value = result.value === `?1`
    }
    return result
  }
}

// sf-list
//       = list-member *( OWS "," OWS list-member )
function sf_list() {
  return (rest) => {
    const result = list([
      list_member(),
      _repeat_list_member()
    ])(rest)

    if (result.ok) {
      // [ [1,[]], [ [2,[]], [3,[]] .. ] ]
      result.value = [result.value[0], ...result.value[1]]
    }
    return result
  }
}

// [repeat of list member]
//   = *( OWS "," OWS list-member )
function _repeat_list_member() {
  function fn() {
    return (rest) => {
      const result = list([
        token(/^([ \t]*),([ \t]*)/),
        list_member()
      ])(rest)

      if (result.ok) {
        // [ ',', [a, []] => [a, []]
        result.value = result.value[1]
      }
      return result
    }
  }
  return repeat(0, 1024, fn())
}

// list-member
//       = sf-item
//       / inner-list
function list_member() {
  return alt([
    sf_item(),
    inner_list(),
  ])
}

// inner-list
//       = "(" *SP [ sf-item *( 1*SP sf-item ) *SP ] ")" parameters
function inner_list() {
  return (rest) => {
    const result = list([
      token(/^\( */),
      _optional_inner_item(),
      token(/^\)/),
      parameters()
    ])(rest)

    if (result.ok) {
      // [ "(", repeat, ")", param ] => [repeat, param]
      const [_open, inner_list, _close, params] = result.value
      result.value = {value: inner_list, params}
    }
    return result
  }
}

// [ sf-item *( 1*SP sf-item ) *SP ]
function _optional_inner_item() {
  return (rest) => {
    const result = repeat(0, 1, list([
      sf_item(),
      _repeat_inner_item(),
      token(/^ */)
    ]))(rest)

    if (result.ok) {
      if (result.value.length > 0) {
        // [[sf_item, repeat, space]] => [sf_item, ...repeat]
        result.value = [result.value[0][0], ...result.value[0][1]]
      }
    }
    return result
  }
}

function _repeat_inner_item() {
  function fn() {
    return (rest) => {
      const result = list([
        token(/^ +/),
        sf_item()
      ])(rest)

      if (result.ok) {
        // [token, sf_item] => sf_item
        result.value = result.value[1]
      }
      return result
    }
  }
  return repeat(0, 256, fn())
}

// sf-dictionary
//       = dict-member *( OWS "," OWS dict-member )
function sf_dictionary() {
  return (rest) => {
    const result = list([
      dict_member(),
      _repeat_dict_member(),
    ])(rest)

    if (result.ok) {
      // [dict_member, repeated]
      const [[key, [value]], rest] = result.value
      result.value = Object.fromEntries([[key, value], ...rest])
    }
    return result
  }
}

// repeat of dict member
function _repeat_dict_member() {
  function fn() {
    return (rest) => {
      const result = list([
        token(/^([ \t]*),([ \t]*)/),
        dict_member()
      ])(rest)

      if (result.ok) {
        // [',', [ "a", [ [1,[]] ]]] => ["a", [1,[]]
        const [_comma, [key, [param]]] = result.value
        result.value = [key, param]
      }
      return result
    }
  }
  return repeat(0, 1024, fn())
}

// dict-member
//       = member-name [ "=" member-value ]
//       = member-name [ ( "=" member-value ) / parameters ] TODO: https://github.com/httpwg/http-extensions/issues/1273
// member-name
//       = key
function dict_member() {
  return list([
    sf_key(),
    repeat(0, 1, _optional_member_value())
  ])
}

function _optional_member_value() {
  return (rest) => {
    const result = alt([
      list([
        token(/^=/),
        member_value(),
      ]),
      parameters()
    ])(rest)

    if (result.ok) {
      if (result.value[0] === `=`) {
        // ['=', [member]] => [1, []]
        result.value = result.value[1]
      } else {
        // value should be true if member is ommited
        result.value = {value: true, params: result.value}
      }
    }
    return result
  }
}

// member-value
//       = sf-item
//       / inner-list
function member_value() {
  return alt([
    sf_item(),
    inner_list()
  ])
}

// sf-item
//       = bare-item parameters
function sf_item() {
  return (rest) => {
    const result = list([
      bare_item(),
      parameters()
    ])(rest)

    if (result.ok) {
      const [value, params] = result.value
      result.value = {value, params}
    }
    return result
  }
}

// bare-item
//       = sf-integer
//       / sf-decimal
//       / sf-string
//       / sf-token
//       / sf-binary
//       / sf-boolean
function bare_item() {
  return alt([
    sf_decimal(),
    sf_integer(),
    sf_string(),
    sf_token(),
    sf_binary(),
    sf_boolean(),
  ])
}

// parameters
//       = *( ";" *SP parameter )
function parameters() {
  return (rest) => {
    const result = repeat(0, 256, _inner_parameters())(rest)

    if (result.ok) {
      result.value = Object.fromEntries(result.value)
    }

    return result
  }
}

function _inner_parameters() {
  return (rest) => {
    const result = list([
      token(/^; */),
      parameter()
    ])(rest)

    if (result.ok) {
      // [';' , paramete] => parameter
      result.value = result.value[1]
    }
    return result
  }
}

// parameter
//       = param-name [ "=" param-value ]
// param-name
//       = key
// param-value
//       = bare-item
function parameter() {
  return list([
    sf_key(),
    param_value(),
  ])
}

// [ "=" param-value ]
function param_value() {
  return (rest) => {
    const result = repeat(0, 1, list([
      token(/^=/),
      bare_item()
    ]))(rest)

    if (result.ok) {
      if (result.value.length === 0) {
        // no parameter is true
        // [] => true
        result.value = true
      } else {
        // [['=', value]] => value
        result.value = result.value[0][1]
      }
    }

    return result
  }
}

// key
//       = ( lcalpha / "*" )
//         *( lcalpha / DIGIT / "_" / "-" / "." / "*" )
// lcalpha
//       = %x61-7A ; a-z
function sf_key() {
  return token(/^([a-z\*])([a-z0-9\_\-\.\*]){0,64}/)
}


module.exports = {
  encodeItem,
  encodeList,
  encodeDict,
  decodeItem,
  decodeList,
  decodeDict,

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
}
