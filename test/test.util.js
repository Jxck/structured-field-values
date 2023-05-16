import fs from "fs"
import base32 from "hi-base32"
import {
  Item
} from "../index.js"

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
    case `date`:
      return new Date(e.value * 1000)
    default:
      return e
  }
}

export function formatItem([value, params]) {
  value  = format(value)
  params = formatParams(params)
  return new Item(value, params)
}

export function formatList(expected) {
  return expected.map(([value, params]) => {
    value  = formatValue(value)
    params = formatParams(params)
    return new Item(value, params)
  })
}

export function formatDict(expected) {
  return Object.fromEntries(expected.map(([name, [value, params]]) => {
    value  = formatValue(value)
    params = formatParams(params)
    return [name, new Item(value, params)]
  }))
}

function formatValue(value) {
  return Array.isArray(value) ? value.map(formatItem) : format(value)
}

function formatParams(params) {
  return params.length === 0 ? null : Object.fromEntries(params.map(format))
}
