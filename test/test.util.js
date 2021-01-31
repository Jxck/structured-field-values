import fs from "fs"
import base32 from "hi-base32"

export function log(...arg) {
  try {
    throw new Error()
  } catch (err) {
    const line = err.stack.split(`\n`)[2].split(`/`).pop()
    console.log(line, ...arg)
  }
}

export const j = JSON.stringify.bind(JSON)

export const  s = (value)  => Symbol.for(value)
export const ss = (values) => values.map((value) => Symbol.for(value))

// read json test suite
export function read(name) {
  return JSON.parse(fs.readFileSync(`./structured-field-tests/${name}.json`).toString())
}

// convert "expected" in test.json into JS Primitive
export function format(e) {
  if (Array.isArray(e)) {
    return e.map(format)
  }
  switch(e[`__type`]) {
    case `binary`:
      return Uint8Array.from(e.value === `` ? [] : base32.decode.asBytes(e.value))
    case `token`:
      return Symbol.for(e.value)
    default:
      return e
  }
}

export function formatItem(expected) {
  const [_value, _params] = expected
  const value  = format(_value)
  const params = Object.fromEntries(_params.map(format))
  return {value, params}
}

export function formatList(expected) {
  return expected.map(([value, params]) => {
    if (Array.isArray(value)) {
      return {
        value: value.map(formatItem),
        params: Object.fromEntries(params.map(format))
      }
    } else {
      return {
        value: format(value),
        params: Object.fromEntries(params.map(format))
      }
    }
  })
}

export function formatDict(expected) {
  return Object.fromEntries(expected.map(([name, member]) => {
    const [value, params] = member
    if (Array.isArray(value[0])) {
      return [name, {
        value: value.map(formatItem),
        params: Object.fromEntries(params.map(format))
      }]
    } else {
      return [name, {
        value: format(value),
        params: Object.fromEntries(params.map(format)),
      }]
    }
  }))
}
