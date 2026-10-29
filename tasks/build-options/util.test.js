const { describe, expect, test } = require('@jest/globals')
const { parseColormapValue } = require('./util')

describe('parseColormapValue', () => {
  test('parses closed and half-open numeric intervals', () => {
    expect(parseColormapValue('[0,1.181e+14)')).toEqual([0, 1.181e14])
    expect(parseColormapValue('[4.570,5)')).toEqual([4.57, 5])
    expect(parseColormapValue('[-1,0)')).toEqual([-1, 0])
    expect(parseColormapValue('[5]')).toEqual([5])
    expect(parseColormapValue('[0)')).toEqual([0])
  })

  test('maps +INF to the largest finite number instead of NaN', () => {
    const [min, max] = parseColormapValue('[15.00,+INF)')
    expect(min).toBe(15)
    expect(max).toBe(Number.MAX_VALUE)
    expect(Number.isFinite(max)).toBe(true)
  })

  test('maps -INF to the most negative finite number', () => {
    const [min, max] = parseColormapValue('[-INF,150)')
    expect(min).toBe(-Number.MAX_VALUE)
    expect(max).toBe(150)
    expect(min).toBeLessThan(max)
  })

  test('survives JSON serialization without null bounds', () => {
    const values = [
      parseColormapValue('[-INF,150)'),
      parseColormapValue('[150,350)'),
      parseColormapValue('[350,+INF)')
    ]
    const json = JSON.stringify(values)
    expect(json).not.toContain('null')
    expect(JSON.parse(json)).toEqual(values)
  })

  test('accepts unsigned and lower-case infinity spellings', () => {
    expect(parseColormapValue('[1,INF)')).toEqual([1, Number.MAX_VALUE])
    expect(parseColormapValue('[-inf,1)')).toEqual([-Number.MAX_VALUE, 1])
    expect(parseColormapValue('[1,Infinity)')).toEqual([1, Number.MAX_VALUE])
  })

  test('rejects bounds that are not numbers', () => {
    expect(() => parseColormapValue('[foo,1)')).toThrow('Invalid value: [foo,1)')
    expect(() => parseColormapValue('[1,)')).toThrow('Invalid value: [1,)')
  })
})
