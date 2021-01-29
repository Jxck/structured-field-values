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
    if (value === true) return `;${serializeKey(key)}` // omit true
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
const KEY_FORMAT = /^[a-z\*][a-z0-9\-\_\.\*]*$/
export function serializeKey(key) {
  if (KEY_FORMAT.test(key) === false) {
    throw new Error(`fail to serialize key: ${key}`)
  }
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
      if (Number.isInteger(value)) {
        return serializeInteger(value)
      }
      return serializeDecimal(value)
    case "string":
      return serializeString(value)
    case "symbol":
      return serializeToken(value)
    case "boolean":
      return serializeBoolean(value)
    case "object":
      if (value instanceof Uint8Array) {
        return serializeByteSequence(value)
      }
    default:
      break;
  }
}

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
function serializeInteger(value) {
  if (value < -999999999999999n || 999999999999999n < value) throw new Error(`fail to serialize integer: ${value}`)
  return value.toString()
}

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
function serializeDecimal(value) {
  if (value > 999999999999) throw new Error(`fail to serialize decimal: ${value}`)
  return (Math.round(value*1000)/1000).toString()
}

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
function serializeString(value) {
  if (/[\x00-\x1f\x7f]+/.test(value)) throw new Error(`fail to serialize string: ${value}`)
  return `"${value.replace(/\\/g, `\\\\`).replace(/"/g, `\\\"`)}"`
}

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
function serializeToken(value) {
  return Symbol.keyFor(value)
}

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
function serializeBoolean(value) {
  return value ? "?1" : "?0"
}

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
function serializeByteSequence(value) {
  return `:${base64encode(value)}:`
}


// 4.2.1.  Parsing a List
//
// Given an ASCII string as input_string, return an array of
// (item_or_inner_list, parameters) tuples. input_string is modified to
// remove the parsed value.
//
// 1.  Let members be an empty array.
//
// 2.  While input_string is not empty:
//
//     1.  Append the result of running Parsing an Item or Inner List
//         (Section 4.2.1.1) with input_string to members.
//
//     2.  Discard any leading OWS characters from input_string.
//
//     3.  If input_string is empty, return members.
//
//     4.  Consume the first character of input_string; if it is not
//         ",", fail parsing.
//
//     5.  Discard any leading OWS characters from input_string.
//
//     6.  If input_string is empty, there is a trailing comma; fail
//         parsing.
//
// 3.  No structured data has been found; return members (which is
//     empty).
export function parseList(input) {
  const members = []
  while(value !== '') {
    parseItemOrInnerList()
  }
  return members
}



// 4.2.1.1.  Parsing an Item or Inner List
//
// Given an ASCII string as input_string, return the tuple
// (item_or_inner_list, parameters), where item_or_inner_list can be
// either a single bare item, or an array of (bare_item, parameters)
// tuples. input_string is modified to remove the parsed value.
//
// 1.  If the first character of input_string is "(", return the result
//     of running Parsing an Inner List (Section 4.2.1.2) with
//     input_string.
//
// 2.  Return the result of running Parsing an Item (Section 4.2.3) with
//     input_string.
function parseItemOrInnerList(input) {
  if (input === "(") {
    return parseInnerList(input)
  }
  return parseItem(input)
}

// 4.2.1.2.  Parsing an Inner List
//
// Given an ASCII string as input_string, return the tuple (inner_list,
// parameters), where inner_list is an array of (bare_item, parameters)
// tuples. input_string is modified to remove the parsed value.
//
// 1.  Consume the first character of input_string; if it is not "(",
//     fail parsing.
//
// 2.  Let inner_list be an empty array.
//
// 3.  While input_string is not empty:
//
//     1.  Discard any leading SP characters from input_string.
//
//     2.  If the first character of input_string is ")":
//
//         1.  Consume the first character of input_string.
//
//         2.  Let parameters be the result of running Parsing
//             Parameters (Section 4.2.3.2) with input_string.
//
//         3.  Return the tuple (inner_list, parameters).
//
//     3.  Let item be the result of running Parsing an Item
//         (Section 4.2.3) with input_string.
//
//     4.  Append item to inner_list.
//
//     5.  If the first character of input_string is not SP or ")", fail
//         parsing.
function parseInnerList(input) {
}



// 4.  The end of the inner list was not found; fail parsing.
//
// 4.2.2.  Parsing a Dictionary
//
// Given an ASCII string as input_string, return an ordered map whose
// values are (item_or_inner_list, parameters) tuples. input_string is
// modified to remove the parsed value.
//
// 1.  Let dictionary be an empty, ordered map.
//
// 2.  While input_string is not empty:
//
//     1.  Let this_key be the result of running Parsing a Key
//         (Section 4.2.3.3) with input_string.
//
//     2.  If the first character of input_string is "=":
//
//         1.  Consume the first character of input_string.
//
//         2.  Let member be the result of running Parsing an Item or
//             Inner List (Section 4.2.1.1) with input_string.
//
//     3.  Otherwise:
//
//         1.  Let value be Boolean true.
//
//         2.  Let parameters be the result of running Parsing
//             Parameters Section 4.2.3.2 with input_string.
//
//         3.  Let member be the tuple (value, parameters).
//
//     4.  Add name this_key with value member to dictionary.  If
//         dictionary already contains a name this_key (comparing
//         character-for-character), overwrite its value.
//
//     5.  Discard any leading OWS characters from input_string.
//
//     6.  If input_string is empty, return dictionary.
//
//     7.  Consume the first character of input_string; if it is not
//         ",", fail parsing.
//
//     8.  Discard any leading OWS characters from input_string.
//
//     9.  If input_string is empty, there is a trailing comma; fail
//         parsing.
//
// 3.  No structured data has been found; return dictionary (which is
//     empty).
//
// Note that when duplicate Dictionary keys are encountered, this has
// the effect of ignoring all but the last instance.

// 4.2.3.  Parsing an Item
//
// Given an ASCII string as input_string, return a (bare_item,
// parameters) tuple. input_string is modified to remove the parsed
// value.
//
// 1.  Let bare_item be the result of running Parsing a Bare Item
//     (Section 4.2.3.1) with input_string.
//
// 2.  Let parameters be the result of running Parsing Parameters
//     (Section 4.2.3.2) with input_string.
//
// 3.  Return the tuple (bare_item, parameters).
function parseItem(input) {

}




// 4.2.3.1.  Parsing a Bare Item
//
// Given an ASCII string as input_string, return a bare Item.
// input_string is modified to remove the parsed value.
//
// 1.  If the first character of input_string is a "-" or a DIGIT,
//     return the result of running Parsing an Integer or Decimal
//     (Section 4.2.4) with input_string.
//
// 2.  If the first character of input_string is a DQUOTE, return the
//     result of running Parsing a String (Section 4.2.5) with
//     input_string.
//
// 3.  If the first character of input_string is ":", return the result
//     of running Parsing a Byte Sequence (Section 4.2.7) with
//     input_string.
//
// 4.  If the first character of input_string is "?", return the result
//     of running Parsing a Boolean (Section 4.2.8) with input_string.
//
// 5.  If the first character of input_string is an ALPHA or "*", return
//     the result of running Parsing a Token (Section 4.2.6) with
//     input_string.
//
// 6.  Otherwise, the item type is unrecognized; fail parsing.
function parseBareItem(input_string) {
  let i = 0
  if (input_string[i] === `"`) {
    return parseString(input_string)
  }
  if (input_string[i] === `:`) {
    return parseByteSequence(input_string)
  }
  if (input_string[i] === `?`) {
    return parseBoolean(input_string)
  }
  if (/^[\-0-9]/.test(input_string[i])) {
    return parseIntegerOrDecimal(input_string)
  }
  if (/^[a-zA-Z\*]/.test(input_string[i])) {
    return parseToken(input_string)
  }
  throw new Error(`failed to parse ${input_string}`)
}


console.assert(parseBareItem(`a123_-.*`)                === `a123_-.*`)
console.assert(parseBareItem(`*a123`)                   === `*a123`)
console.assert(parseBareItem("0")                       === 0)
console.assert(parseBareItem("123")                     === 123)
console.assert(parseBareItem("123.456")                 === 123.456)
console.assert(parseBareItem(`"asdf"`)                  === `asdf`)
console.assert(parseBareItem(`"a\\""`)                  === `a\"`)
console.assert(parseBareItem(`"a\\\\"`)                 === `a\\`)
console.assert(parseBareItem(`"a\\\\c"`)                === `a\\c`)
console.assert(parseBareItem(`*foo123/456`)             === `*foo123/456`)
console.assert(parseBareItem(`foo123`)                  === `foo123`)
console.assert(parseBareItem(`ABC!#$%&'*+-.^_'|~:/012`) === `ABC!#$%&'*+-.^_'|~:/012`)
console.assert(parseBareItem("?1")                      === true)
console.assert(parseBareItem("?0")                      === false)


// 4.2.3.2.  Parsing Parameters
//
// Given an ASCII string as input_string, return an ordered map whose
// values are bare Items. input_string is modified to remove the parsed
// value.
//
// 1.  Let parameters be an empty, ordered map.
//
// 2.  While input_string is not empty:
//
//     1.  If the first character of input_string is not ";", exit the
//         loop.
//
//     2.  Consume a ";" character from the beginning of input_string.
//
//     3.  Discard any leading SP characters from input_string.
//
//     4.  let param_name be the result of running Parsing a Key
//         (Section 4.2.3.3) with input_string.
//
//     5.  Let param_value be Boolean true.
//
//     6.  If the first character of input_string is "=":
//
//         1.  Consume the "=" character at the beginning of
//             input_string.
//
//         2.  Let param_value be the result of running Parsing a Bare
//             Item (Section 4.2.3.1) with input_string.
//
//     7.  Append key param_name with value param_value to parameters.
//         If parameters already contains a name param_name (comparing
//         character-for-character), overwrite its value.
//
// 3.  Return parameters.
//
// Note that when duplicate Parameter keys are encountered, this has the
// effect of ignoring all but the last instance.
function parseParameters(input) {
}

// 4.2.3.3.  Parsing a Key
//
// Given an ASCII string as input_string, return a key. input_string is
// modified to remove the parsed value.
//
// 1.  If the first character of input_string is not lcalpha or "*",
//     fail parsing.
//
// 2.  Let output_string be an empty string.
//
// 3.  While input_string is not empty:
//
//     1.  If the first character of input_string is not one of lcalpha,
//         DIGIT, "_", "-", ".", or "*", return output_string.
//
//     2.  Let char be the result of consuming the first character of
//         input_string.
//
//     3.  Append char to output_string.
//
// 4.  Return output_string.
function parseKey(input_string) {
  let i = 0
  if (/^[a-z\*]$/.test(input_string[i]) === false) {
    throw new Error(`failed to parse ${input_string}`)
  }
  let output_string = ""
  while(input_string.length > i) {
    if (/^[a-z0-9\_\-\.\*]$/.test(input_string[i]) === false) {
      return output_string
    }
    output_string += input_string[i]
    i ++
  }
  return output_string
}

console.assert(parseKey(`a123_-.*`) === `a123_-.*`)
console.assert(parseKey(`*a123`)    === `*a123`)


// 4.2.4.  Parsing an Integer or Decimal
//
// Given an ASCII string as input_string, return an Integer or Decimal.
// input_string is modified to remove the parsed value.
//
// NOTE: This algorithm parses both Integers (Section 3.3.1) and
// Decimals (Section 3.3.2), and returns the corresponding structure.
//
// 1.   Let type be "integer".
//
// 2.   Let sign be 1.
//
// 3.   Let input_number be an empty string.
//
// 4.   If the first character of input_string is "-", consume it and
//      set sign to -1.
//
// 5.   If input_string is empty, there is an empty integer; fail
//      parsing.
//
// 6.   If the first character of input_string is not a DIGIT, fail
//      parsing.
//
// 7.   While input_string is not empty:
//
//      1.  Let char be the result of consuming the first character of
//          input_string.
//
//      2.  If char is a DIGIT, append it to input_number.
//
//      3.  Else, if type is "integer" and char is ".":
//
//          1.  If input_number contains more than 12 characters, fail
//              parsing.
//
//          2.  Otherwise, append char to input_number and set type to
//              "decimal".
//
//      4.  Otherwise, prepend char to input_string, and exit the loop.
//
//      5.  If type is "integer" and input_number contains more than 15
//          characters, fail parsing.
//
//      6.  If type is "decimal" and input_number contains more than 16
//          characters, fail parsing.
//
// 8.   If type is "integer":
//
//      1.  Parse input_number as an integer and let output_number be
//          the product of the result and sign.
//
//      2.  If output_number is outside the range -999,999,999,999,999
//          to 999,999,999,999,999 inclusive, fail parsing.
//
// 9.   Otherwise:
//
//      1.  If the final character of input_number is ".", fail parsing.
//
//      2.  If the number of characters after "." in input_number is
//          greater than three, fail parsing.
//
//      3.  Parse input_number as a decimal number and let output_number
//          be the product of the result and sign.
//
// 10.  Return output_number.
function parseIntegerOrDecimal(input_string) {
  let type = "integer"
  let sign = 1
  let input_number = ""
  let i = 0

  if (input_string[i] === "-") {
    sign = -1
    i ++
  }
  if (input_string.length <= i || /^\d$/.test(input_string[i]) === false) {
    throw new Error(`failed to parse ${input_string}`)
  }

  while (input_string.length > i ) {
    if (/^\d$/.test(input_string[i])) {
      input_number += input_string[i]
    } else if (type === "integer" && /\./.test(input_string[i])) {
      if (input_number.length > 12) throw new Error(`failed to parse ${input_string}`)
      input_number += input_string[i]
      type = "decimal"
    } else {
      i--
      break
    }
    if (type === "integer" && input_number.length > 15) {
      throw new Error(`failed to parse ${input_string}`)
    }
    if (type === "decimal" && input_number.length > 16) {
      throw new Error(`failed to parse ${input_string}`)
    }
    i ++
  }

  let output_number
  if (type === "integer") {
    output_number = parseInt(input_number) * sign
    if (output_number < -999999999999999n || 999999999999999n < output_number) throw new Error(`fail to parse integer: ${input_number}`)
  } else {
    if (/\.\d{1,3}$/.test(input_number) === false) throw new Error(`fail to parse decimal: ${input_number}`)
    output_number = parseFloat(input_number) * sign
  }
  return output_number
}

console.assert(parseIntegerOrDecimal("0")       === 0)
console.assert(parseIntegerOrDecimal("123")     === 123)
console.assert(parseIntegerOrDecimal("123.456") === 123.456)

;[
  "123.",
  "123.4567",
  "9999999999999999",
  "-9999999999999999",
  "1234567890123456",
  "1.234567890123456",
  "1234567890123.4",
].forEach((sfv) => {
  try {
    console.log(parseIntegerOrDecimal(sfv))
    console.assert(false)
  } catch (err) {
    console.assert(true)
  }
})

// 4.2.5.  Parsing a String
//
// Given an ASCII string as input_string, return an unquoted String.
// input_string is modified to remove the parsed value.
//
// 1.  Let output_string be an empty string.
//
// 2.  If the first character of input_string is not DQUOTE, fail
//     parsing.
//
// 3.  Discard the first character of input_string.
//
// 4.  While input_string is not empty:
//
//     1.  Let char be the result of consuming the first character of
//         input_string.
//
//     2.  If char is a backslash ("\"):
//
//         1.  If input_string is now empty, fail parsing.
//
//         2.  Let next_char be the result of consuming the first
//             character of input_string.
//
//         3.  If next_char is not DQUOTE or "\", fail parsing.
//
//         4.  Append next_char to output_string.
//
//     3.  Else, if char is DQUOTE, return output_string.
//
//     4.  Else, if char is in the range %x00-1f or %x7f (i.e., is not
//         in VCHAR or SP), fail parsing.
//
//     5.  Else, append char to output_string.
//
// 5.  Reached the end of input_string without finding a closing DQUOTE;
//     fail parsing.
export function parseString(input_string) {
  let output_string = ""
  let i = 0
  if (input_string[i] !== `"`) {
    throw new Error(`failed to parse ${input_string}`)
  }
  i ++
  while(input_string.length > i ) {
    // console.log(i, input_string[i], output_string)
    if (input_string[i] === `\\`) {
      if (input_string.length <= i+1) {
        throw new Error(`failed to parse ${input_string}`)
      }
      i++
      if (input_string[i] !== `"` && input_string[i] !== `\\`) {
        throw new Error(`failed to parse ${input_string}`)
      }
      output_string += input_string[i]
    } else if (input_string[i] === `"`) {
      return output_string
    } else if (/[\x00-\x1f\x7f]+/.test(input_string[i])) {
      throw new Error(`failed to parse ${input_string}`)
    } else {
      output_string += input_string[i]
    }
    i++
  }
  throw new Error(`failed to parse ${input_string}`)
}


console.assert(parseString(`"asdf"`)   === `asdf`)
console.assert(parseString(`"a\\""`)   === `a\"`)
console.assert(parseString(`"a\\\\"`)  === `a\\`)
console.assert(parseString(`"a\\\\c"`) === `a\\c`)

;[`"a\\"`, ``].forEach((sfv) => {
  try {
    console.log(parseString(sfv))
    console.assert(false)
  } catch (err) {
    console.assert(true)
  }
})

// 4.2.6.  Parsing a Token
//
// Given an ASCII string as input_string, return a Token. input_string
// is modified to remove the parsed value.
//
// 1.  If the first character of input_string is not ALPHA or "*", fail
//     parsing.
//
// 2.  Let output_string be an empty string.
//
// 3.  While input_string is not empty:
//
//     1.  If the first character of input_string is not in tchar, ":"
//         or "/", return output_string.
//
//     2.  Let char be the result of consuming the first character of
//         input_string.
//
//     3.  Append char to output_string.
//
// 4.  Return output_string.
function parseToken(input_string) {
  let i = 0
  if (/^[a-zA-Z\*]$/.test(input_string[i]) === false) {
    throw new Error(`failed to parse ${input_string}`)
  }
  let output_string = ""
  while(input_string.length > i) {
    if (/^[\!\#\$\%\&\'\*\+\-\.\^\_\`\|\~\w\:\/]$/.test(input_string[i]) === false) {
      // TODO: to Symbol
      return output_string
    }
    output_string += input_string[i]
    i ++
  }
  // TODO: to Symbol
  return output_string
}

console.assert(parseToken(`*foo123/456`)             === `*foo123/456`)
console.assert(parseToken(`foo123`)                  === `foo123`)
console.assert(parseToken(`ABC!#$%&'*+-.^_'|~:/012`) === `ABC!#$%&'*+-.^_'|~:/012`)

try {
  console.log(parseToken(``))
  console.assert(false)
} catch(err) {
  console.assert(true)
}



// 4.2.7.  Parsing a Byte Sequence
//
// Given an ASCII string as input_string, return a Byte Sequence.
// input_string is modified to remove the parsed value.
//
// 1.  If the first character of input_string is not ":", fail parsing.
//
// 2.  Discard the first character of input_string.
//
// 3.  If there is not a ":" character before the end of input_string,
//     fail parsing.
//
// 4.  Let b64_content be the result of consuming content of
//     input_string up to but not including the first instance of the
//     character ":".
//
// 5.  Consume the ":" character at the beginning of input_string.
//
// 6.  If b64_content contains a character not included in ALPHA, DIGIT,
//     "+", "/" and "=", fail parsing.
//
// 7.  Let binary_content be the result of Base 64 Decoding [RFC4648]
//     b64_content, synthesizing padding if necessary (note the
//     requirements about recipient behavior below).
//
// 8.  Return binary_content.
//
// Because some implementations of base64 do not allow rejection of
// encoded data that is not properly "=" padded (see [RFC4648],
// Section 3.2), parsers SHOULD NOT fail when "=" padding is not
// present, unless they cannot be configured to do so.
//
// Because some implementations of base64 do not allow rejection of
// encoded data that has non-zero pad bits (see [RFC4648], Section 3.5),
// parsers SHOULD NOT fail when non-zero pad bits are present, unless
// they cannot be configured to do so.
//
// This specification does not relax the requirements in [RFC4648],
// Section 3.1 and 3.3; therefore, parsers MUST fail on characters
// outside the base64 alphabet, and on line feeds in encoded data.
function parseByteSequence(input_string) {
  let i = 0
  if (input_string[i] !== ":") {
    throw new Error(`failed to parse ${input_string}`)
  }
  i ++
}

// 4.2.8.  Parsing a Boolean
//
// Given an ASCII string as input_string, return a Boolean. input_string
// is modified to remove the parsed value.
//
// 1.  If the first character of input_string is not "?", fail parsing.
//
// 2.  Discard the first character of input_string.
//
// 3.  If the first character of input_string matches "1", discard the
//     first character, and return true.
//
// 4.  If the first character of input_string matches "0", discard the
//     first character, and return false.
//
// 5.  No value has matched; fail parsing.
function parseBoolean(input_string) {
  let i = 0
  if (input_string[i] !== "?") {
    throw new Error(`failed to parse ${input_string}`)
  }
  i ++
  if (input_string[i] === "1") {
    return true
  }
  if (input_string[i] === "0") {
    return false
  }
  throw new Error(`failed to parse ${input_string}`)
}

console.assert(parseBoolean("?1") === true)
console.assert(parseBoolean("?0") === false)

try {
  parseBoolean("1")
  console.assert(false)
} catch(err) {
  console.assert(true)
}

console.log({ok})
