"use strict";

let tmp
const ok = true
function log(...arg) {
  try {
    throw new Error()
  } catch (err) {
    const line = err.stack.split('\n')[2].split('/').pop()
    console.log(line, ...arg)
  }
}
const j = JSON.stringify.bind(JSON)

const tee = (fn, k) => {
  return (rest) => {
    const result = fn(rest)
    // console.log(k, result)
    return result
  }
}

export function parseItem(value) {
  // trim leading/trailing space
  // https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19#section-4.2
  const result = sf_item()(value.trim())
  if (result.ok === false) {
    throw new Error('failed to parse')
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}

export function parseList(value) {
  // return if empty
  // https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19#section-4.2.1
  if (value === '') return []

  const result = sf_list()(value.trim())
  if (result.ok === false) {
    throw new Error('failed to parse')
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}

export function parseDict(value) {
  // return if empty
  // https://tools.ietf.org/html/draft-ietf-httpbis-header-structure-19#section-4.2.1
  if (value === '') return []

  const result = sf_dictionary()(value.trim())
  if (result.ok === false) {
    throw new Error('failed to parse')
  }
  if (result.rest.length > 0) {
    throw new Error(`failed to parse: trailing values ${result.rest}`)
  }
  return result.value
}


//////////////////////////////////////////////////////
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

export function repeat(min, max, fn, join = true) { // default join('')
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
      if (join) {
        return {ok, value: value.join(""), rest}
      }
      return {ok, value, rest}
    }
  }
}

export function base64decode(str) {
  if (typeof window === 'undefined') {
    return Uint8Array.from(Buffer.from(str, 'base64'))
  } else {
    return new Uint8Array([...atob(str)].map(a => a.charCodeAt(0)));
  }
}

export function base64encode(binary) {
  if (typeof window === 'undefined') {
    return Buffer.from(binary).toString('base64')
  } else {
    // TODO: browser base64
  }
}
//////////////////////////////////////////////////////

// sf-integer
//       = ["-"] 1*15DIGIT
export function sf_integer() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,15}/)(rest)
    if (result.ok) {
      return {ok, value: parseInt(result.value), rest: result.rest}
    } else {
      return {ok: false, rest}
    }
  }
}

// sf-decimal
//       = ["-"] 1*12DIGIT "." 1*3DIGIT
export function sf_decimal() {
  return (rest) => {
    const result = token(/^\-{0,1}\d{1,12}\.\d{1,3}/)(rest)
    if (result.ok) {
      return {ok, value: parseFloat(result.value), rest: result.rest}
    } else {
      return {ok: false, rest}
    }
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
      result.value = result.value[1]
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
export function sf_binary() {
  return (rest) => {
    const result = list([
      token(/^:/),
      token(/^([\w+/=]){0,16384}/), // base64
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

// sf-boolean
//       = "?" boolean
// boolean
//       = "0"
//       / "1"
export function sf_boolean() {
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

// repeat of list member
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
  return tee(repeat(0, 1024, fn(), false), 'repeat list')
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
      const [open, repeat, close, param] = result.value
      result.value = [repeat, param]
    }
    return result
  }
}

export function _optional_inner_item() {
  return (rest) => {
    const result = repeat(0, 1, list([
      sf_item(),
      _repeat_inner_item(),
      token(/^ */)
    ]), false)(rest)

    if (result.ok && result.value.length > 0) {
      //  [ list
      //    [1,[]], sf_item
      //    [[2,[]],[3,[]]], repeat
      //    "" token
      //  ]
      //  => [[1, []], [2, []], [3, []]]
      const [[item, repeat, _sp]] = result.value
      result.value = [item, ...repeat]
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
        // [" ", [2,[]]] => [2, []]
        result.value = result.value[1]
      }
      return result
    }
  }
  return repeat(0, 256, fn(), false)
}

const input = "a=1, b;foo=9, c=3"
console.log({input})
log(j(sf_dictionary()(input).value))
log(j([["a", [1, []]], ["b", [true, [["foo", 9]]]], ["c", [3, []]]]))

// sf-dictionary
//       = dict-member *( OWS "," OWS dict-member )
export function sf_dictionary() {
  return (rest) => {
    const result = list([
      dict_member(),
      _repeat_dict_member(),
    ])(rest)

    if (result.ok) {
      // [ ["a",[[1,[]]]], [["b",[2,[]]],["c",[3,[]]],["d",[4,[]]]] ]
      const [[key, [value]], rest] = result.value
      result.value = [[key, value], ...rest]
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
  return repeat(0, 1024, fn() , false)
}

// dict-member
//       = member-name [ "=" member-value ]
//       = member-name [ ( "=" member-value ) / parameters ] TODO: https://github.com/httpwg/http-extensions/issues/1273
// member-name
//       = key
function dict_member() {
  function fn() {
    return (rest) => {
      const result = alt([
        list([
          token(/^=/),
          member_value(),
        ]),
        parameters()
      ])(rest)


      if (result.ok) {
        if (result.value[0] === '=') {
          // ['=', [member]] => [1, []]
          result.value = result.value[1]
        } else {
          // value should be true if member is ommited
          result.value = [true, result.value]
        }
      }
      return result
    }
  }

  return list([
    sf_key(),
    repeat(0, 1, fn(), false)
  ])
}

// member-value
//       = sf-item
//       / inner-list
function member_value() {
  return (rest) => {
    const result = alt([sf_item(), inner_list()])(rest)
    return result
  }
}



// sf-item
//       = bare-item parameters
export function sf_item() {
  return (rest) => {
    const result = list([bare_item(), parameters()])(rest)
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
  return tee(alt([
    sf_decimal(),
    sf_integer(),
    sf_string(),
    sf_token(),
    sf_binary(),
    sf_boolean(),
  ]), 'bare_item')
}

// parameters
//       = *( ";" *SP parameter )
export function parameters() {
  const fn = (rest) => {
    const result = list([
      token(/^; */),
      parameter()
    ])(rest)

    if (result.ok === false) return result

    // [';' , [a, 1]] => [a, 1]
    result.value = result.value[1]
    return result
  }

  return (rest) => {
    const result = repeat(0, 256, fn, false)(rest)
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
    ]), false)(rest)

    if (result.ok === false) return result

    if (result.value.length === 0) {
      // no parameter is true
      // ;a => [a, true]
      result.value = true
    }

    if (result.value.length === 1 && result.value[0][0] === '=') {
      // b=1 => [=, 1]
      result.value = result.value[0][1]
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
  return tee(token(/^([a-z\*])([a-z0-9\_\-\.\*]){0,64}/), 'sf_key')
}
