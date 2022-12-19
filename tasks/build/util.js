function dictMerge (target, ...objs) {
  objs.forEach(obj => {
    if (!_.isPlainObject(obj)) return obj

    _.forOwn(obj, (v, k) => {
      if (_.has(target, k) && _.isPlainObject(target[k])) {
        if (_.has(v, 'type') && _.has(target[k], 'type')) {
          if (v.type !== target[k].type) return target
        }
        Object.assign(target[k], v)
      } else {
        target[k] = _.cloneDeep(v)
      }
    })
  })
  return target
}

module.exports = {
  dictMerge
}
