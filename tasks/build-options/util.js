async function dictMerge (target, ...args) {
  // Merge multiple objects
  if (args.length > 1) {
    for (const obj of args) {
      await dictMerge(target, obj)
    }
    return target
  }

  // Recursively merge objects and set non-object values
  const obj = args[0]
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k in target && typeof target[k] === 'object' && target[k] !== null) {
      if ('type' in v && 'type' in target[k]) {
        if (v.type !== target[k].type) {
          return target
        }
      }
      await dictMerge(target[k], v)
    } else {
      target[k] = Object.assign({}, v)
    }
  }
  return target
}

module.exports = {
  dictMerge
}
