const state = {}

export function setState (item, value) {
  state[item] = value
}

export function getState (item) {
  return state[item]
}
