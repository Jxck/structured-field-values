const ok = true

import { base64decode, base64encode } from "../index.js"

/// parser
export function parseItem(value) {
  // trim leading/trailing space
  // https://www.rfc-editor.org/rfc/rfc8941.html#section-4.2
  const result = sf_item()(value.trim())
  if (result.ok === false) {
    throw new Error(`failed to parse`)
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}

export function parseList(value) {
  // return if empty
  // https://www.rfc-editor.org/rfc/rfc8941.html#section-4.2.1
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

export function parseDict(value) {
  // return if empty
  // https://www.rfc-editor.org/rfc/rfc8941.html#section-4.2.1
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

/////////////////////////
// BFN utility
/////////////////////////

// a => token(/^a/)
export function token(reg) {
  return (rest) => {
    const result = reg.exec(rest)
    if (result === null) {
      return { ok: false, rest }
    } else {
      const value = result[0]
      return { ok, value, rest: rest.substr(value.length) }
    }
  }
}

// (a / b) => alt([a(), b()])
export function alt(fns) {
  return (rest) => {
    for (let i = 0; i < fns.length; i++) {
      const result = fns[i](rest)
      if (result.ok) {
        return result
      }
    }
    return { ok: false, rest }
  }
}

// (a b c) => list([a(), b(), c()])
export function list(fns) {
  return (rest) => {
    const value = []
    const orig = rest
    for (let i = 0; i < fns.length; i++) {
      const result = fns[i](rest)
      if (result.ok === false) {
        return { ok: false, rest: orig }
      }
      value.push(result.value)
      rest = result.rest
    }
    return { ok, value, rest }
  }
}

// *(a b) => repeat(0, Infinity, list([a(), b()]))
export function repeat(min, max, fn) {
  return (rest) => {
    const value = []
    const orig = rest
    while (true) {
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
      return { ok: false, rest: orig }
    } else {
      return { ok, value, rest }
    }
  }
}

// [ a b ] => optional(list[a(), b()])
export function optional(fn) {
  return repeat(0, 1, fn)
}

/////////////////////////
// BNF in spec
/////////////////////////

// sf-integer
//       = ["-"] 1*15DIGIT
export function sf_integer() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,15}/)(rest)
    if (result.ok) {
      return { ok, value: parseInt(result.value), rest: result.rest }
    }
    return { ok: false, rest }
  }
}

// sf-decimal
//       = ["-"] 1*12DIGIT "." 1*3DIGIT
export function sf_decimal() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,12}\.\d{1,3}/)(rest)
    if (result.ok) {
      return { ok, value: parseFloat(result.value), rest: result.rest }
    }
    return { ok: false, rest }
  }
}

// sf-string
//       = DQUOTE *chr DQUOTE
export function sf_string() {
  return function (rest) {
    const fn = list([
      token(/^"/), // DQUOTE
      repeat(0, 1024, char()), // *char
      token(/^"/) // DQUOTE
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
export function char() {
  return alt([escaped(), unescaped()])
}

// unescaped
//       = %x20-21  (x22 is ")
//       / %x23-5B  (x5c is \)
//       / %x5D-7E
export function unescaped() {
  return token(/^([\x20-\x21\x23-\x5B\x5D-\x7E])/)
}

// escaped
//       = "\" ( DQUOTE / "\" )
export function escaped() {
  return (rest) => {
    const result = token(/^((\\\")|(\\\\))/)(rest)
    if (result.ok) {
      // unescape (\\" => ",  \\\\ => \\)
      result.value = result.value === `\\"` ? `"` : `\\`
    }
    return result
  }
}

// sf-token
//       = ( ALPHA / "*" ) *( tchar / ":" / "/" )
export function sf_token() {
  return (rest) => {
    const result = token(/^([a-zA-Z\*])([\!\#\$\%\&\'\*\+\-\.\^\_\`\|\~\w\:\/]){0,512}/)(rest)
    if (result.ok) {
      result.value = Symbol.for(result.value)
    }
    return result
  }
}

// sf-binary
//       = ":" *(base64) ":"
// base64
//       = ALPHA
//       / DIGIT
//       / "+"
//       / "/"
//       / "="
export function sf_binary() {
  return (rest) => {
    const result = list([
      token(/^:/),
      token(/^([\w+/=]){0,16384}/), // base64
      token(/^:/)
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
export function sf_boolean() {
  return (rest) => {
    const result = token(/^((\?0)|(\?1))/)(rest)
    if (result.ok) {
      // ?1 => true, ?0 => false
      result.value = result.value === `?1`
    }
    return result
  }
}

// sf-date
//       = "@" ["-"] 1*15DIGIT
export function sf_date() {
  return (rest) => {
    const result = list([token(/^@/), token(/\-{0,1}\d{1,15}/)])(rest)
    if (result.ok) {
      return { ok, value: new Date(result.value[1] * 1000), rest: result.rest }
    }
    return { ok: false, rest }
  }
}

// sf-list
//       = list-member *( OWS "," OWS list-member )
export function sf_list() {
  return (rest) => {
    const result = list([
      list_member(),
      _repeat_list_member() // *( OWS "," OWS list-member )
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
export function _repeat_list_member() {
  function fn() {
    return (rest) => {
      const result = list([
        token(/^([ \t]*),([ \t]*)/), // OWS "," OWS
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
export function list_member() {
  return alt([sf_item(), inner_list()])
}

// inner-list
//       = "(" *SP [ sf-item *( 1*SP sf-item ) *SP ] ")" parameters
export function inner_list() {
  return (rest) => {
    const result = list([
      token(/^\( */), // "(" *SP
      _optional_inner_item(), // [ sf-item *( 1*SP sf-item ) *SP ]
      token(/^\)/), // ")"
      parameters()
    ])(rest)

    if (result.ok) {
      // [ "(", repeat, ")", param ] => [repeat, param]
      const [_open, inner_list, _close, params] = result.value
      result.value = { value: inner_list, params }
    }
    return result
  }
}

// [ sf-item *( 1*SP sf-item ) *SP ]
export function _optional_inner_item() {
  return (rest) => {
    const result = optional(
      list([
        sf_item(),
        _repeat_inner_item(), // *( 1*SP sf-item )
        token(/^ */)
      ])
    )(rest)

    if (result.ok) {
      if (result.value.length > 0) {
        // [[sf_item, repeat, space]] => [sf_item, ...repeat]
        result.value = [result.value[0][0], ...result.value[0][1]]
      }
    }
    return result
  }
}

export function _repeat_inner_item() {
  function fn() {
    return (rest) => {
      const result = list([
        token(/^ +/), // 1*SP
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
export function sf_dictionary() {
  return (rest) => {
    const result = list([
      dict_member(),
      _repeat_dict_member() // *( OWS "," OWS dict-member )
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
export function _repeat_dict_member() {
  function fn() {
    return (rest) => {
      const result = list([
        token(/^([ \t]*),([ \t]*)/), // OWS "," OWS
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
//       = member-name [ ( "=" member-value ) / parameters ]
// member-name
//       = key
export function dict_member() {
  return list([
    sf_key(), // key
    optional(_optional_member_value())
  ])
}

export function _optional_member_value() {
  return (rest) => {
    const result = alt([
      list([
        token(/^=/), // "="
        member_value()
      ]),
      parameters()
    ])(rest)

    if (result.ok) {
      if (result.value[0] === `=`) {
        // ['=', [member]] => [1, []]
        result.value = result.value[1]
      } else {
        // value should be true if member is omitted
        result.value = { value: true, params: result.value }
      }
    }
    return result
  }
}

// member-value
//       = sf-item
//       / inner-list
export function member_value() {
  return alt([sf_item(), inner_list()])
}

// sf-item
//       = bare-item parameters
export function sf_item() {
  return (rest) => {
    const result = list([bare_item(), parameters()])(rest)

    if (result.ok) {
      const [value, params] = result.value
      result.value = { value, params }
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
//       / sf-date
export function bare_item() {
  return alt([
    sf_decimal(), // decimal first
    sf_integer(),
    sf_string(),
    sf_token(),
    sf_binary(),
    sf_boolean(),
    sf_date()
  ])
}

// parameters
//       = *( ";" *SP parameter )
export function parameters() {
  return (rest) => {
    const result = repeat(0, 256, _inner_parameters())(rest)

    if (result.ok) {
      result.value = Object.fromEntries(result.value)
    }

    return result
  }
}

export function _inner_parameters() {
  return (rest) => {
    const result = list([
      token(/^; */), // ";"
      parameter()
    ])(rest)

    if (result.ok) {
      // [';' , parameter] => parameter
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
export function parameter() {
  return list([sf_key(), param_value()])
}

// [ "=" param-value ]
export function param_value() {
  return (rest) => {
    const result = optional(
      list([
        token(/^=/), // "="
        bare_item()
      ])
    )(rest)

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
export function sf_key() {
  return token(/^([a-z\*])([a-z0-9\_\-\.\*]){0,64}/)
}
