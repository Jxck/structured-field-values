;`use strict`

/**
 * Tagged Template Literal for Error message
 * @param {TemplateStringsArray} strings
 * @param  {...any} keys
 * @returns string
 */
function err(strings, ...keys) {
  keys = keys.map((key) => {
    if (Array.isArray(key)) return JSON.stringify(key)
    if (key instanceof Map) return "Map{}"
    if (key instanceof Set) return "Set{}"
    if (typeof key === "object") return JSON.stringify(key)
    return String(key)
  })
  const result = strings.map((string, i) => {
    return [string, keys.at(i)]
  })
  return result.flat().join("")
}

export class Item {
  /**
   * @property {BareItem} value
   * @property {Parameters} params
   */
  constructor(value, params = null) {
    if (Array.isArray(value)) {
      value = value.map((v) => {
        if (v instanceof Item) return v
        return new Item(v)
      })
    }
    this.value = value
    this.params = params
  }
}

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
/**
 * @param {Item} value
 * @returns {string}
 */
export function encodeItem(value) {
  return serializeItem(value)
}

/**
 * @param {MemberList} value
 * @returns {string}
 */
export function encodeList(value) {
  return serializeList(value)
}

/**
 * @param {Dictionary} value
 * @returns {string}
 */
export function encodeDict(value) {
  return serializeDict(value)
}

// 4.2.  Parsing Structured Fields
//
// 1.  Convert input_bytes into an ASCII string input_string; if
//     conversion fails, fail parsing.
//
// 2.  Discard any leading SP characters from input_string.
//
// 3.  If field_type is "list", let output be the result of running
//     Parsing a List (Section 4.2.1) with input_string.
//
// 4.  If field_type is "dictionary", let output be the result of
//     running Parsing a Dictionary (Section 4.2.2) with input_string.
//
// 5.  If field_type is "item", let output be the result of running
//     Parsing an Item (Section 4.2.3) with input_string.
//
// 6.  Discard any leading SP characters from input_string.
//
// 7.  If input_string is not empty, fail parsing.
//
// 8.  Otherwise, return output.
/**
 * @param {string} input
 * @returns {Item}
 */
export function decodeItem(input) {
  try {
    const { input_string, value } = parseItem(input.trim())
    if (input_string !== "") throw new Error(err`failed to parse "${input_string}" as Item`)
    return value
  } catch (cause) {
    throw new Error(err`failed to parse "${input}" as Item`, { cause })
  }
}

/**
 * @param {string} input
 * @returns {MemberList}
 */
export function decodeList(input) {
  try {
    const { input_string, value } = parseList(input.trim())
    if (input_string !== "") throw new Error(err`failed to parse "${input_string}" as List`)
    return value
  } catch (cause) {
    throw new Error(err`failed to parse "${input}" as List`, { cause })
  }
}

/**
 * @param {string} input
 * @returns {Dictionary}
 */
export function decodeDict(input) {
  try {
    const { input_string, value } = parseDictionary(input.trim())
    if (input_string !== "") throw new Error(err`failed to parse "${input_string}" as Dict`)
    return value
  } catch (cause) {
    throw new Error(err`failed to parse "${input}" as Dict`, { cause })
  }
}

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
/**
 * @param {MemberList} list
 * @return {string}
 */
export function serializeList(list) {
  if (Array.isArray(list) === false) throw new Error(err`failed to serialize "${list}" as List`)
  return list
    .map((item) => {
      if (item instanceof Item === false) item = new Item(item)
      if (Array.isArray(item.value)) {
        return serializeInnerList(item)
      }
      return serializeItem(item)
    })
    .join(", ")
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
/**
 * @param {Object} value
 * @return {string}
 */
export function serializeInnerList(value) {
  return `(${value.value.map(serializeItem).join(" ")})${serializeParams(value.params)}`
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
/**
 * @param {Object} params
 * @return {string}
 */
export function serializeParams(params) {
  if (params === null) return ""
  return Object.entries(params)
    .map(([key, value]) => {
      if (value === true) return `;${serializeKey(key)}` // omit true
      return `;${serializeKey(key)}=${serializeBareItem(value)}`
    })
    .join("")
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
/**
 * @param {string} value
 * @return {string}
 */
export function serializeKey(value) {
  if (/^[a-z\*][a-z0-9\-\_\.\*]*$/.test(value) === false) {
    throw new Error(err`failed to serialize "${value}" as Key`)
  }
  return value
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
/**
 * @param {Dictionary} dict
 * @return {string}
 */
export function serializeDict(dict) {
  if (typeof dict !== "object") throw new Error(err`failed to serialize "${dict}" as Dict`)
  const entries = dict instanceof Map ? dict.entries() : Object.entries(dict)
  return Array.from(entries)
    .map(([key, item]) => {
      if (item instanceof Item === false) item = new Item(item)
      let output = serializeKey(key)
      if (item.value === true) {
        output += serializeParams(item.params)
      } else {
        output += "="
        if (Array.isArray(item.value)) {
          output += serializeInnerList(item)
        } else {
          output += serializeItem(item)
        }
      }
      return output
    })
    .join(", ")
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
/**
 * @param {Item} value
 * @return {string}
 */
export function serializeItem(value) {
  if (value instanceof Item) {
    return `${serializeBareItem(value.value)}${serializeParams(value.params)}`
  } else {
    return serializeBareItem(value)
  }
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
// 7.  If input_item is a Date, return the result of running Serializing
//     a Date (Section 4.1.10) with input_item.
//
// 8.  Otherwise, fail serialization.

/**
 * @param {any} value
 * @return {string}
 */
export function serializeBareItem(value) {
  switch (typeof value) {
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(err`failed to serialize "${value}" as Bare Item`)
      }
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
      if (value instanceof Date) {
        return serializeDate(value)
      }
      if (value instanceof Uint8Array) {
        return serializeByteSequence(value)
      }
    default:
      // fail
      throw new Error(err`failed to serialize "${value}" as Bare Item`)
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
/**
 * @param {number} value
 * @return {string}
 */
export function serializeInteger(value) {
  if (value < -999_999_999_999_999n || 999_999_999_999_999n < value) throw new Error(err`failed to serialize "${value}" as Integer`)
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
/**
 * @param {number} value
 * @return {string}
 */
export function serializeDecimal(value) {
  const roundedValue = roundToEven(value, 3) // round to 3 decimal places
  if (Math.floor(Math.abs(roundedValue)).toString().length > 12) throw new Error(err`failed to serialize "${value}" as Decimal`)
  const stringValue = roundedValue.toString()
  return stringValue.includes(".") ? stringValue : `${stringValue}.0`
}

/**
 * This implements the rounding procedure described in step 2 of the "Serializing a Decimal" specification.
 * This rounding style is known as "even rounding", "banker's rounding", or "commercial rounding".
 *
 * @param {number} value
 * @param {number} precision - decimal places to round to
 * @return {number}
 */
function roundToEven(value, precision) {
  if (value < 0) {
    return -roundToEven(-value, precision)
  }

  const decimalShift = Math.pow(10, precision)
  const isEquidistant = Math.abs(((value * decimalShift) % 1) - 0.5) < Number.EPSILON
  if (isEquidistant) {
    // If the tail of the decimal place is 'equidistant' we round to the nearest even value
    const flooredValue = Math.floor(value * decimalShift)
    return (flooredValue % 2 === 0 ? flooredValue : flooredValue + 1) / decimalShift
  } else {
    // Otherwise, proceed as normal
    return Math.round(value * decimalShift) / decimalShift
  }
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
/**
 * @param {string} value
 * @return {string}
 */
export function serializeString(value) {
  if (/[\x00-\x1f\x7f]+/.test(value)) throw new Error(err`failed to serialize "${value}" as string`)
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
/**
 * @param {symbol} token
 * @return {string}
 */
export function serializeToken(token) {
  /** @type {string} */
  const value = Symbol.keyFor(token)
  if (/^([a-zA-Z\*])([\!\#\$\%\&\'\*\+\-\.\^\_\`\|\~\w\:\/]*)$/.test(value) === false) {
    throw new Error(err`failed to serialize "${value}" as token`)
  }
  return value
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
/**
 * @param {Uint8Array} value
 * @return {string}
 */
export function serializeByteSequence(value) {
  if (ArrayBuffer.isView(value) === false) throw new Error(err`failed to serialize "${value}" as Byte Sequence`)
  return `:${base64encode(value)}:`
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
/**
 * @param {boolean} value
 * @return {string}
 */
export function serializeBoolean(value) {
  if (typeof value !== "boolean") throw new Error(err`failed to serialize "${value}" as boolean`)
  return value ? "?1" : "?0"
}

// 4.1.10.  Serializing a Date
//
// Given a Date as input_integer, return an ASCII string suitable for
// use in an HTTP field value.

// 1.  Let output be "@".

// 2.  Append to output the result of running Serializing an Integer
//     with input_date (Section 4.1.4).

// 3.  Return output.
/**
 * @param {Date} value
 * @return {string}
 */
export function serializeDate(value) {
  const input_date = value.getTime() / 1000
  return `@${serializeInteger(input_date)}`
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
/**
 * @typedef {Array.<Item|InnerList>} MemberList
 *
 * @typedef {Object} ParsedList
 * @property {MemberList} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedList}
 */
export function parseList(input_string) {
  /** @type {MemberList} */
  const members = []
  while (input_string.length > 0) {
    /** @type {ParsedItemOrInnerList} */
    const parsedItemOrInnerList = parseItemOrInnerList(input_string)
    members.push(parsedItemOrInnerList.value)
    input_string = parsedItemOrInnerList.input_string.trim()
    if (input_string.length === 0) return { input_string, value: members }
    if (input_string[0] !== ",") throw new Error(err`failed to parse "${input_string}" as List`)
    input_string = input_string.substring(1).trim()
    if (input_string.length === 0 || input_string[0] === ",") throw new Error(err`failed to parse "${input_string}" as List`)
  }
  return {
    value: members,
    input_string
  }
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
/**
 * @typedef {ParsedItem|ParsedInnerList} ParsedItemOrInnerList
 *
 * @param {string} input_string
 * @return {ParsedItemOrInnerList}
 */
export function parseItemOrInnerList(input_string) {
  if (input_string[0] === "(") {
    return parseInnerList(input_string)
  }
  return parseItem(input_string)
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
//
// 4.  The end of the inner list was not found; fail parsing.
/**
 * @typedef {Array.<Item>} ItemList
 *
 * @typedef {{value: ItemList, params: Parameters}} InnerList
 *
 * @typedef {Object} ParsedInnerList
 * @property {InnerList} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedInnerList}
 */
export function parseInnerList(input_string) {
  if (input_string[0] !== "(") throw new Error(err`failed to parse "${input_string}" as Inner List`)
  input_string = input_string.substring(1)
  /** @type {ItemList}  */
  const inner_list = []
  while (input_string.length > 0) {
    input_string = input_string.trim()
    if (input_string[0] === ")") {
      input_string = input_string.substring(1)
      const parsedParameters = parseParameters(input_string)
      return {
        value: new Item(inner_list, parsedParameters.value),
        input_string: parsedParameters.input_string
      }
    }
    /** @type {ParsedItem} */
    const parsedItem = parseItem(input_string)
    inner_list.push(parsedItem.value)
    input_string = parsedItem.input_string
    if (input_string[0] !== " " && input_string[0] !== ")") throw new Error(err`failed to parse "${input_string}" as Inner List`)
  }
  throw new Error(err`failed to parse "${input_string}" as Inner List`)
}

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
/**
 * @typedef {Object.<Key, Item|InnerList>|Map} Dictionary
 *
 * @typedef {Object} ParsedDictionary
 * @property {Dictionary} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @param {Object?} option TODO: not fully supported yet
 * @return {ParsedDictionary}
 */
export function parseDictionary(input_string, option = {}) {
  /** @type {Array.<[Key, Item|InnerList]>} */
  const value = [] // ordered map

  /**
   * @param {Array.<[Key, Item|InnerList]>} entries
   * @return {Dictionary}
   */
  function toDict(entries) {
    if (option?.use_map === true) return new Map(entries)
    return Object.fromEntries(entries)
  }

  while (input_string.length > 0) {
    /** @type {Item|InnerList} */
    let member
    /** @type {ParsedKey} */
    const parsedKey = parseKey(input_string)
    /** @type {Key} */
    const this_key = parsedKey.value
    input_string = parsedKey.input_string
    if (input_string[0] === "=") {
      /** @type {ParsedItemOrInnerList} */
      const parsedItemOrInnerList = parseItemOrInnerList(input_string.substring(1))
      member = parsedItemOrInnerList.value
      input_string = parsedItemOrInnerList.input_string
    } else {
      /** @type {ParsedParameters} */
      const parsedParameters = parseParameters(input_string)
      member = new Item(true, parsedParameters.value)
      input_string = parsedParameters.input_string
    }
    value.push([this_key, member])
    input_string = input_string.trim()
    if (input_string.length === 0) return { input_string, value: toDict(value) }
    if (input_string[0] !== ",") throw new Error(err`failed to parse "${input_string}" as Dict`)
    input_string = input_string.substring(1).trim()
    if (input_string.length === 0 || input_string[0] === ",") throw new Error(err`failed to parse "${input_string}" as Dict`)
  }
  return {
    value: toDict(value),
    input_string
  }
}

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
/**
 * @typedef {Object} ParsedItem
 * @property {Item} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedItem}
 */
export function parseItem(input_string) {
  const parsedBareItem = parseBareItem(input_string)
  const value = parsedBareItem.value
  input_string = parsedBareItem.input_string
  const parsedParameters = parseParameters(input_string)
  const params = parsedParameters.value
  input_string = parsedParameters.input_string
  /** @type {Item} */
  const item = new Item(value, params)
  return {
    value: item,
    input_string
  }
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
// 6.  If the first character of input_string is "@", return the result
//     of running Parsing a Date (Section 4.2.9) with input_string.
//
// 7.  Otherwise, the item type is unrecognized; fail parsing.
/**
 * @typedef {ParsedString|ParsedByteSequence|ParsedBoolean|ParsedIntegerOrDecimal|ParsedToken|ParsedDate} ParsedBareItem
 *
 * @param {string} input_string
 * @return {ParsedBareItem}
 */
export function parseBareItem(input_string) {
  const first = input_string[0]
  if (first === `"`) {
    return parseString(input_string)
  }
  if (/^[\-0-9]/.test(first)) {
    return parseIntegerOrDecimal(input_string)
  }
  if (first === `?`) {
    return parseBoolean(input_string)
  }
  if (first === `:`) {
    return parseByteSequence(input_string)
  }
  if (/^[a-zA-Z\*]/.test(first)) {
    return parseToken(input_string)
  }
  if (first === `@`) {
    return parseDate(input_string)
  }
  throw new Error(err`failed to parse "${input_string}" as Bare Item`)
}

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
/**
 * @typedef {string | Uint8Array | boolean | number | symbol | Date} BareItem
 *
 * @typedef {Object.<Key, BareItem>} Parameters
 *
 * @typedef {Object} ParsedParameters
 * @property {Parameters} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedParameters}
 */
export function parseParameters(input_string) {
  /**
   * null by default for easy to detect parameter existence.
   * @type {Parameters}
   */
  let parameters = null
  while (input_string.length > 0) {
    if (input_string[0] !== ";") break
    input_string = input_string.substring(1).trim()
    const parsedKey = parseKey(input_string)
    const param_name = parsedKey.value
    /** @type {BareItem} */
    let param_value = true
    input_string = parsedKey.input_string
    if (input_string[0] === "=") {
      input_string = input_string.substring(1)
      const parsedBareItem = parseBareItem(input_string)
      param_value = parsedBareItem.value
      input_string = parsedBareItem.input_string
    }
    // initialize as object when params exists
    if (parameters === null) parameters = {}
    // override if param_name exists
    parameters[param_name] = param_value
  }
  return {
    value: parameters,
    input_string
  }
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
/**
 * @typedef {string} Key
 *
 * @typedef {Object} ParsedKey
 * @property {Key} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedKey}
 */
export function parseKey(input_string) {
  let i = 0
  if (/^[a-z\*]$/.test(input_string[i]) === false) {
    throw new Error(err`failed to parse "${input_string}" as Key`)
  }
  /** @type {Key} */
  let output_string = ""
  while (input_string.length > i) {
    if (/^[a-z0-9\_\-\.\*]$/.test(input_string[i]) === false) {
      return {
        value: output_string,
        input_string: input_string.substring(i)
      }
    }
    output_string += input_string[i]
    i++
  }
  return {
    value: output_string,
    input_string: input_string.substring(i)
  }
}

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
/**
 * @typedef {Object} ParsedIntegerOrDecimal
 * @property {number} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedIntegerOrDecimal}
 */
export function parseIntegerOrDecimal(input_string) {
  const orig_string = input_string
  let sign = 1
  let input_number = ""
  let output_number
  let i = 0

  if (input_string[i] === "-") {
    sign = -1
    input_string = input_string.substring(1)
  }

  if (input_string.length <= 0) throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`)

  const re_integer = /^(\d+)?/g
  const result_integer = re_integer.exec(input_string)
  if (result_integer[0].length === 0) throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`)
  input_number += result_integer[1]
  input_string = input_string.substring(re_integer.lastIndex)

  if (input_string[0] === ".") {
    // decimal
    if (input_number.length > 12) throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`)
    const re_decimal = /^(\.\d+)?/g
    const result_decimal = re_decimal.exec(input_string)
    input_string = input_string.substring(re_decimal.lastIndex)
    // 9.2.  If the number of characters after "." in input_number is greater than three, fail parsing.
    if (result_decimal[0].length === 0 || result_decimal[1].length > 4) throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`)
    input_number += result_decimal[1]
    // 7.6.  If type is "decimal" and input_number contains more than 16 characters, fail parsing.
    if (input_number.length > 16) throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`)
    output_number = parseFloat(input_number) * sign
  } else {
    // integer
    // 7.5.  If type is "integer" and input_number contains more than 15 characters, fail parsing.
    if (input_number.length > 15) throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`)
    output_number = parseInt(input_number) * sign
    if (output_number < -999999999999999n || 999999999999999n < output_number)
      throw new Error(`failed to parse "${input_number}" as Integer or Decimal`)
  }
  return {
    value: output_number,
    input_string
  }
}

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
/**
 * @typedef {Object} ParsedString
 * @property {string} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedString}
 */
export function parseString(input_string) {
  let output_string = ""
  let i = 0
  if (input_string[i] !== `"`) {
    throw new Error(`failed to parse "${input_string}" as String`)
  }
  i++
  while (input_string.length > i) {
    // console.log(i, input_string[i], output_string)
    if (input_string[i] === `\\`) {
      if (input_string.length <= i + 1) {
        throw new Error(`failed to parse "${input_string}" as String`)
      }
      i++
      if (input_string[i] !== `"` && input_string[i] !== `\\`) {
        throw new Error(`failed to parse "${input_string}" as String`)
      }
      output_string += input_string[i]
    } else if (input_string[i] === `"`) {
      return {
        value: output_string,
        input_string: input_string.substring(++i)
      }
    } else if (/[\x00-\x1f\x7f]+/.test(input_string[i])) {
      throw new Error(`failed to parse "${input_string}" as String`)
    } else {
      output_string += input_string[i]
    }
    i++
  }
  throw new Error(`failed to parse "${input_string}" as String`)
}

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
/**
 * @typedef {Object} ParsedToken
 * @property {symbol} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedToken}
 */
export function parseToken(input_string) {
  if (/^[a-zA-Z\*]$/.test(input_string[0]) === false) {
    throw new Error(`failed to parse "${input_string}" as Token`)
  }
  const re = /^([\!\#\$\%\&\'\*\+\-\.\^\_\`\|\~\w\:\/]+)/g
  const output_string = re.exec(input_string)[1]
  input_string = input_string.substring(re.lastIndex)
  return {
    value: Symbol.for(output_string),
    input_string
  }
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
/**
 * @typedef {Object} ParsedByteSequence
 * @property {Uint8Array} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedByteSequence}
 */
export function parseByteSequence(input_string) {
  if (input_string[0] !== ":") throw new Error(`failed to parse "${input_string}" as Byte Sequence`)
  input_string = input_string.substring(1)
  if (input_string.includes(":") === false) throw new Error(`failed to parse "${input_string}" as Byte Sequence`)
  const re = /(^.*?)(:)/g
  const b64_content = re.exec(input_string)[1]
  input_string = input_string.substring(re.lastIndex)
  // pass b64_content char check step 6
  const binary_content = base64decode(b64_content)
  return {
    value: binary_content,
    input_string
  }
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
/**
 * @typedef {Object} ParsedBoolean
 * @property {boolean} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedBoolean}
 */
export function parseBoolean(input_string) {
  let i = 0
  if (input_string[i] !== "?") {
    throw new Error(`failed to parse "${input_string}" as Boolean`)
  }
  i++
  if (input_string[i] === "1") {
    return {
      value: true,
      input_string: input_string.substring(++i)
    }
  }
  if (input_string[i] === "0") {
    return {
      value: false,
      input_string: input_string.substring(++i)
    }
  }
  throw new Error(`failed to parse "${input_string}" as Boolean`)
}

// 4.2.9.  Parsing a Date
//
// Given an ASCII string as input_string, return a Date. input_string is
// modified to remove the parsed value.
//
// 1.  If the first character of input_string is not "@", fail parsing.
//
// 2.  Discard the first character of input_string.
//
// 3.  Let output_date be the result of running Parsing an Integer or
//     Decimal (Section 4.2.4) with input_string.
//
// 4.  If output_date is a Decimal, fail parsing.
//
// 5.  Return output_date.
/**
 * @typedef {Object} ParsedDate
 * @property {Date} value
 * @property {string} input_string
 *
 * @param {string} input_string
 * @return {ParsedDate}
 */
export function parseDate(input_string) {
  let i = 0
  if (input_string[i] !== "@") {
    throw new Error(`failed to parse "${input_string}" as Date`)
  }
  i++
  const output_date = parseIntegerOrDecimal(input_string.substring(i))
  if (Number.isInteger(output_date.value) === false) {
    throw new Error(`failed to parse "${input_string}" as Date`)
  }
  return {
    value: new Date(output_date.value * 1000),
    input_string: output_date.input_string
  }
}

/////////////////////////
// base64 utility
/////////////////////////
/**
 * @param {string} str
 * @return {Uint8Array}
 */
export function base64decode(str) {
  return new Uint8Array([...atob(str)].map((a) => a.charCodeAt(0)))
}

/**
 * @param {Uint8Array} binary
 * @return {string}
 */
export function base64encode(binary) {
  return btoa(String.fromCharCode(...binary))
}
