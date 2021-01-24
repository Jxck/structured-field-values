`use strict`;
const ok = true

/////////////////////////
// public interface
/////////////////////////
// 4.1.  Serializing Structured Fields
//
// 1.  If the structure is a Dictionary or List and its value is empty
//     (i.e., it has no members), do not serialize the field at all
//     (i.e., omit both the field-name and field-value).
//
// 2.  If the structure is a List, let output_string be the result of
//     running Serializing a List (Section 4.1.1) with the structure.
//
// 3.  Else if the structure is a Dictionary, let output_string be the
//     result of running Serializing a Dictionary (Section 4.1.2) with
//     the structure.
//
// 4.  Else if the structure is an Item, let output_string be the result
//     of running Serializing an Item (Section 4.1.3) with the
//     structure.
//
// 5.  Else, fail serialization.
//
// 6.  Return output_string converted into an array of bytes, using
//     ASCII encoding [RFC0020].


export function decodeItem(value) { return parseItem(value) }
export function decodeList(value) { return parseList(value) }
export function decodeDict(value) { return parseDict(value) }
export function encodeItem(value) { return serializeItem(value) }
export function encodeList(value) { return serializeList(value) }
export function encodeDict(value) { return serializeDict(value) }


// 4.1.1.  Serializing a List
//
// Given an array of (member_value, parameters) tuples as input_list,
// return an ASCII string suitable for use in a HTTP field value.
//
// 1.  Let output be an empty string.
//
// 2.  For each (member_value, parameters) of input_list:
//
//     1.  If member_value is an array, append the result of running
//         Serializing an Inner List (Section 4.1.1.1) with
//         (member_value, parameters) to output.
//
//     2.  Otherwise, append the result of running Serializing an Item
//         (Section 4.1.3) with (member_value, parameters) to output.
//
//     3.  If more member_values remain in input_list:
//
//         1.  Append "," to output.
//
//         2.  Append a single SP to output.
//
// 3.  Return output.
export function serializeList(list) {
  return list.map(({value, params}) => {
    if (Array.isArray(value)) {
      return serializeInnerList({value, params})
    }
    return serializeItem({value, params})
  }).join(", ")
}

// 4.1.1.1.  Serializing an Inner List
//
// Given an array of (member_value, parameters) tuples as inner_list,
// and parameters as list_parameters, return an ASCII string suitable
// for use in a HTTP field value.
//
// 1.  Let output be the string "(".
//
// 2.  For each (member_value, parameters) of inner_list:
//
//     1.  Append the result of running Serializing an Item
//         (Section 4.1.3) with (member_value, parameters) to output.
//
//     2.  If more values remain in inner_list, append a single SP to
//         output.
//
// 3.  Append ")" to output.
//
// 4.  Append the result of running Serializing Parameters
//     (Section 4.1.1.2) with list_parameters to output.
//
// 5.  Return output.
export function serializeInnerList({value, params}) {
  return `(${value.map(serializeItem).join(" ")})${serializeParams(params)}`
}

// 4.1.1.2.  Serializing Parameters
//
// Given an ordered Dictionary as input_parameters (each member having a
// param_name and a param_value), return an ASCII string suitable for
// use in a HTTP field value.
//
// 1.  Let output be an empty string.
//
// 2.  For each param_name with a value of param_value in
//     input_parameters:
//
//     1.  Append ";" to output.
//
//     2.  Append the result of running Serializing a Key
//         (Section 4.1.1.3) with param_name to output.
//
//     3.  If param_value is not Boolean true:
//
//         1.  Append "=" to output.
//
//         2.  Append the result of running Serializing a bare Item
//             (Section 4.1.3.1) with param_value to output.
//
// 3.  Return output.
export function serializeParams(params) {
  return Object.entries(params).map(([key, value]) => {
    if (value === true) return `;${key}` // omit true
    return `;${serializeKey(key)}=${serializeBareItem(value)}`
  }).join("")
}

// 4.1.1.3.  Serializing a Key
//
// Given a key as input_key, return an ASCII string suitable for use in
// a HTTP field value.
//
// 1.  Convert input_key into a sequence of ASCII characters; if
//     conversion fails, fail serialization.
//
// 2.  If input_key contains characters not in lcalpha, DIGIT, "_", "-",
//     ".", or "*" fail serialization.
//
// 3.  If the first character of input_key is not lcalpha or "*", fail
//     serialization.
//
// 4.  Let output be an empty string.
//
// 5.  Append input_key to output.
//
// 6.  Return output.
export function serializeKey(key) {
  return key
}

// 4.1.2.  Serializing a Dictionary
//
// Given an ordered Dictionary as input_dictionary (each member having a
// member_name and a tuple value of (member_value, parameters)), return
// an ASCII string suitable for use in a HTTP field value.
//
// 1.  Let output be an empty string.
//
// 2.  For each member_name with a value of (member_value, parameters)
//     in input_dictionary:
//
//     1.  Append the result of running Serializing a Key
//         (Section 4.1.1.3) with member's member_name to output.
//
//     2.  If member_value is Boolean true:
//
//         1.  Append the result of running Serializing Parameters
//             (Section 4.1.1.2) with parameters to output.
//
//     3.  Otherwise:
//
//         1.  Append "=" to output.
//
//         2.  If member_value is an array, append the result of running
//             Serializing an Inner List (Section 4.1.1.1) with
//             (member_value, parameters) to output.
//
//         3.  Otherwise, append the result of running Serializing an
//             Item (Section 4.1.3) with (member_value, parameters) to
//             output.
//
//     4.  If more members remain in input_dictionary:
//
//         1.  Append "," to output.
//
//         2.  Append a single SP to output.
//
// 3.  Return output.
export function serializeDict(dict) {
  return Object.entries(dict).map(([key, {value, params}]) => {
    let output = serializeKey(key)
    if (value === true) {
      output += serializeParams(params)
    } else {
      output += "="
      if (Array.isArray(value)) {
        output += serializeInnerList({value, params})
      } else {
        output += serializeItem({value, params})
      }
    }
    return output
  }).join(", ")
}

// 4.1.3.  Serializing an Item
//
// Given an Item as bare_item and Parameters as item_parameters, return
// an ASCII string suitable for use in a HTTP field value.
//
// 1.  Let output be an empty string.
//
// 2.  Append the result of running Serializing a Bare Item
//     Section 4.1.3.1 with bare_item to output.
//
// 3.  Append the result of running Serializing Parameters
//     Section 4.1.1.2 with item_parameters to output.
//
// 4.  Return output.
export function serializeItem({value, params}) {
  return `${serializeBareItem(value)}${serializeParams(params)}`
}

// 4.1.3.1.  Serializing a Bare Item
//
// Given an Item as input_item, return an ASCII string suitable for use
// in a HTTP field value.
//
// 1.  If input_item is an Integer, return the result of running
//     Serializing an Integer (Section 4.1.4) with input_item.
//
// 2.  If input_item is a Decimal, return the result of running
//     Serializing a Decimal (Section 4.1.5) with input_item.
//
// 3.  If input_item is a String, return the result of running
//     Serializing a String (Section 4.1.6) with input_item.
//
// 4.  If input_item is a Token, return the result of running
//     Serializing a Token (Section 4.1.7) with input_item.
//
// 5.  If input_item is a Boolean, return the result of running
//     Serializing a Boolean (Section 4.1.9) with input_item.
//
// 6.  If input_item is a Byte Sequence, return the result of running
//     Serializing a Byte Sequence (Section 4.1.8) with input_item.
//
// 7.  Otherwise, fail serialization.
export function serializeBareItem(value) {
  switch (typeof value) {
    case "number":
      // 4.1.4.  Serializing an Integer
      //
      // Given an Integer as input_integer, return an ASCII string suitable
      // for use in a HTTP field value.
      //
      // 1.  If input_integer is not an integer in the range of
      //     -999,999,999,999,999 to 999,999,999,999,999 inclusive, fail
      //     serialization.
      //
      // 2.  Let output be an empty string.
      //
      // 3.  If input_integer is less than (but not equal to) 0, append "-" to
      //     output.
      //
      // 4.  Append input_integer's numeric value represented in base 10 using
      //     only decimal digits to output.
      //
      // 5.  Return output.
      //
      // 4.1.5.  Serializing a Decimal
      //
      // Given a decimal number as input_decimal, return an ASCII string
      // suitable for use in a HTTP field value.
      //
      // 1.   If input_decimal is not a decimal number, fail serialization.
      //
      // 2.   If input_decimal has more than three significant digits to the
      //      right of the decimal point, round it to three decimal places,
      //      rounding the final digit to the nearest value, or to the even
      //      value if it is equidistant.
      //
      // 3.   If input_decimal has more than 12 significant digits to the left
      //      of the decimal point after rounding, fail serialization.
      //
      // 4.   Let output be an empty string.
      //
      // 5.   If input_decimal is less than (but not equal to) 0, append "-"
      //      to output.
      //
      // 6.   Append input_decimal's integer component represented in base 10
      //      (using only decimal digits) to output; if it is zero, append
      //      "0".
      //
      // 7.   Append "." to output.
      //
      // 8.   If input_decimal's fractional component is zero, append "0" to
      //      output.
      //
      // 9.   Otherwise, append the significant digits of input_decimal's
      //      fractional component represented in base 10 (using only decimal
      //      digits) to output.
      //
      // 10.  Return output.
      if (value < -999999999999999n || 999999999999999n < value) throw new Error(`fail serialization: ${value}`)
      return value.toString()
    case "string":
      // 4.1.6.  Serializing a String
      //
      // Given a String as input_string, return an ASCII string suitable for
      // use in a HTTP field value.
      //
      // 1.  Convert input_string into a sequence of ASCII characters; if
      //     conversion fails, fail serialization.
      //
      // 2.  If input_string contains characters in the range %x00-1f or %x7f
      //     (i.e., not in VCHAR or SP), fail serialization.
      //
      // 3.  Let output be the string DQUOTE.
      //
      // 4.  For each character char in input_string:
      //
      //     1.  If char is "\" or DQUOTE:
      //
      //         1.  Append "\" to output.
      //
      //     2.  Append char to output.
      //
      // 5.  Append DQUOTE to output.
      //
      // 6.  Return output.
      if (/[\x00-\x1f\x7f]+/.test(value)) throw new Error(`fail serialization: ${value}`)
      return `"${value.replace(/\\/g, `\\\\`).replace(/"/g, `\\\"`)}"`
    case "symbol":
      // 4.1.7.  Serializing a Token
      //
      // Given a Token as input_token, return an ASCII string suitable for use
      // in a HTTP field value.
      //
      // 1.  Convert input_token into a sequence of ASCII characters; if
      //     conversion fails, fail serialization.
      //
      // 2.  If the first character of input_token is not ALPHA or "*", or the
      //     remaining portion contains a character not in tchar, ":" or "/",
      //     fail serialization.
      //
      // 3.  Let output be an empty string.
      //
      // 4.  Append input_token to output.
      //
      // 5.  Return output.
      return Symbol.keyFor(value)
    case "boolean":
      // 4.1.9.  Serializing a Boolean
      //
      // Given a Boolean as input_boolean, return an ASCII string suitable for
      // use in a HTTP field value.
      //
      // 1.  If input_boolean is not a boolean, fail serialization.
      //
      // 2.  Let output be an empty string.
      //
      // 3.  Append "?" to output.
      //
      // 4.  If input_boolean is true, append "1" to output.
      //
      // 5.  If input_boolean is false, append "0" to output.
      //
      // 6.  Return output.
      return value ? "?1" : "?0"
    case "object":
      if (value instanceof Uint8Array) {
        // 4.1.8.  Serializing a Byte Sequence
        //
        // Given a Byte Sequence as input_bytes, return an ASCII string suitable
        // for use in a HTTP field value.
        //
        // 1.  If input_bytes is not a sequence of bytes, fail serialization.
        //
        // 2.  Let output be an empty string.
        //
        // 3.  Append ":" to output.
        //
        // 4.  Append the result of base64-encoding input_bytes as per
        //     [RFC4648], Section 4, taking account of the requirements below.
        //
        // 5.  Append ":" to output.
        //
        // 6.  Return output.
        //
        // The encoded data is required to be padded with "=", as per [RFC4648],
        // Section 3.2.
        //
        // Likewise, encoded data SHOULD have pad bits set to zero, as per
        // [RFC4648], Section 3.5, unless it is not possible to do so due to
        // implementation constraints.
        return `:${base64encode(value)}:`
      }
    default:
      break;
  }
}


/// parser
export function parseItem(value) {
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

export function parseList(value) {
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

export function parseDict(value) {
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


/////////////////////////
// BFN utility
/////////////////////////

// a => token(/^a/)
export function token(reg) {
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
export function alt(fns) {
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
export function list(fns) {
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
export function repeat(min, max, fn) {
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
export function base64decode(str) {
  if (typeof window === `undefined`) {
    return Uint8Array.from(Buffer.from(str, `base64`))
  } else {
    return new Uint8Array([...atob(str)].map(a => a.charCodeAt(0)));
  }
}

export function base64encode(binary) {
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
export function sf_integer() {
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
export function sf_decimal() {
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
export function sf_string() {
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
export function char() {
  return alt([
    escaped(),
    unescaped(),
  ])
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
      result.value = (result.value === `\\"`) ? `"` : `\\`
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

// sf-list
//       = list-member *( OWS "," OWS list-member )
export function sf_list() {
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
export function _repeat_list_member() {
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
export function list_member() {
  return alt([
    sf_item(),
    inner_list(),
  ])
}

// inner-list
//       = "(" *SP [ sf-item *( 1*SP sf-item ) *SP ] ")" parameters
export function inner_list() {
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
export function _optional_inner_item() {
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

export function _repeat_inner_item() {
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
export function sf_dictionary() {
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
export function _repeat_dict_member() {
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
export function dict_member() {
  return list([
    sf_key(),
    repeat(0, 1, _optional_member_value())
  ])
}

export function _optional_member_value() {
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
export function member_value() {
  return alt([
    sf_item(),
    inner_list()
  ])
}

// sf-item
//       = bare-item parameters
export function sf_item() {
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
export function bare_item() {
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
export function parameter() {
  return list([
    sf_key(),
    param_value(),
  ])
}

// [ "=" param-value ]
export function param_value() {
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
export function sf_key() {
  return token(/^([a-z\*])([a-z0-9\_\-\.\*]){0,64}/)
}
