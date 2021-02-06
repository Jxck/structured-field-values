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
  const params = _params.length === 0 ? null : Object.fromEntries(_params.map(format))
  return {value, params}
}

export function formatList(expected) {
  return expected.map(([value, params]) => {
    value = Array.isArray(value) ? value.map(formatItem) : format(value)
    params = params.length === 0 ? null : Object.fromEntries(params.map(format))
    return { value, params }
  })
}

export function formatDict(expected) {
  return Object.fromEntries(expected.map(([name, [value, params]]) => {
    value  = Array.isArray(value[0]) ? value.map(formatItem) : format(value)
    params = params.length === 0 ? null : Object.fromEntries(params.map(format))
    return [name, { value, params }]
  }))
}
