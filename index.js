"use strict";

let tmp
const ok = true
const log = console.log.bind(console)

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
    throw ParseError('failed to parse')
  }
  if (result.rest.length > 0) {
    throw ParseError(`failed to parse: trailing values ${result.rest}`)
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
      if (result.value == '"b"') debugger
      if (result.ok) {
        value.push(result.value)
        rest = result.rest
      }
    }

    if (value.length == fns.length) {
      return {ok, value, rest}
    } else {
      return {ok: false, rest: orig}
    }
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
    return Buffer.from(str, 'base64')
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
  function fn() {
    return (rest) => {
      const result = list([
        token(/^( *),( *)/),
        list_member()
      ])(rest)

      if (result.ok) {
        const [h, [t]] = result.value
        result.value = t
      }
      return result
    }
  }
  return list([
    list_member(),
    tee(repeat(0, 1024, fn(), false), 'repeat list')
  ])
}

// list-member
//       = sf-item
//       / inner-list
export function list_member() {
  return alt([
    sf_item(),
    // inner_list(),
  ])
}

export function test_sf_list() {
  console.log(sf_list()(`foo, bar, buz`))
  console.log(sf_list()(`"a", "b", "c"`))
}
// test_sf_list()

// function sf_dictionary() {
//   return list([
//     sf_dict_member(),
//     repeat(0, 1024, list([
//       token(/^ */),
//       token(/^,/),
//       token(/^ */),
//       sf_dict_member()
//     ]))
//   ])
// }
// 
// function sf_dict_member() {
//   return list([
//     sf_member_name(),
//     repeat(0, 1, list([
//       token(/^=/),
//       sf_member_value()
//     ]))
//   ])
// }
// 
// function sf_member_name() {
//   return token(/([a-z\*]) ([a-z0-9\_\-\.\*]){0,64}/)
// }
// 
// function sf_member_value() {
//   return alt([sf_item, sf_inner_list])
// }

// sf-item
//       = bare-item parameters
export function sf_item() {
  return tee(list([
    tee(bare_item(), '....bare_item'),
    tee(parameters(), 'parameters')
  ]), 'sf_item')
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
  return (rest) => {
    const fn = (_rest) => {
      const _result = list([
        token(/^; */),
        parameter()
      ])(_rest)

      if (_result.ok === false) return _result

      // [';' , [a, 1]] => [a, 1]
      _result.value = _result.value[1]
      return _result
    }

    return repeat(0, 256, fn, false)(rest)
  }
}


export function test_parameters() {
  // log(parameters()(`; a`))
}
test_parameters()

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
  return token(/^([a-z\*])([a-z0-9\_\-\.\*]){0,64}/)
}
