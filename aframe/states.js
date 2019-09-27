/*
*  states.js
*
*  Manages the vr application's states. The transitions are initiated within the application itself.
*
*  The initial state is defined by startup='state:Loading'.
*  The states component declares the application states that are handled by components within the current aframe entity.
*  A component implements a state by defining a State<state> property that contains an object as follows:
*
*     StateLoading: {
*       enter(state, oldState, how) { ... },   // The state is being entered.
*       exit(state, nextState, how) { ... },    // The state is being exited.
*       pause(state, how) { ... },   // The application is pausing within the current state
*       resume(state, how) { ... }   // The application is resuming within the current state
*     }
*
*  Each state function will be bound to the defining component when called and will be passed the state objects
*  This as the first parm, the actual state id as the second, the related state id as the third and
*  how ('chain', 'push', 'pop', 'start') the call was made as the third.
*
*  On each state transition the states system will emit an event to the scene after 'enter' or 'pause' is called and
*  before 'exit' or 'resume' is called.
*
*  The event will be statechanged with an event detail object:
*     {
*       event: <action><state>Event, // Ex. enterLoadingEvent
*       relatedState: <state>, // old state or new state. Ex. Loading
*       state: <state>, // Ex. Loading
*       action: 'enter', 'exit', 'pause', 'resume'
*       how: 'chain' | 'push' | 'pop' | 'start'
*     }
*/
"use strict";

import aframe from 'aframe';
import { copyValues } from '@micosmo/core/replicate';
import { onLoadedDo } from './startup';

const StateTemplate = Object.freeze({
  state: '<none>',
  enter: noop,
  exit: noop,
  pause: noop,
  resume: noop,
});

aframe.registerSystem("states", {
  init() {
    this.registeredStates = {};
    this.stack = [];
    this.started = false;
    this.currentState = StateTemplate;
  },
  start(state) { this.started = true; enter(this, state, 'start') },
  chain(state) { exit(this, state, 'chain'); enter(this, state, 'chain') },
  push(state) { this.stack.push(this.currentState); exit(this, state, 'push'); enter(this, state, 'push') },
  pop() {
    if (this.stack.length === 0)
      throw new Error(`micosmo:system:states:pop: There is no pushed state to pop.`);
    const oState = this.stack.pop();
    exit(this, oState.state, 'pop');
    enter(this, oState, 'pop');
  },
  pause() { pause(this, 'pause') },
  resume() { resume(this, 'resume') },
});

function enter(states, nextState, how) {
  const oState = typeof nextState === 'object' ? nextState : checkState(states, nextState, 'enter');
  nextState = oState.state;
  const oldState = states.currentState.state;
  oState.enter(nextState, oldState, how);
  states.sceneEl.emit('statechanged', getEventDetail('enter', nextState, oldState, how), false);
  this.currentState = oState;
}

function exit(states, nextState, how) {
  const oState = this.currentState;
  states.sceneEl.emit('statechanged', getEventDetail('exit', oState.state, nextState, how), false);
  oState.exit(oState.state, nextState, how);
}

function pause(states, how) {
  const oState = this.currentState;
  oState.pause(oState.state, how);
  states.sceneEl.emit('statechanged', getEventDetail('pause', oState.state, oState.state, how), false);
}

function resume(states, how) {
  const oState = this.currentState;
  states.sceneEl.emit('statechanged', getEventDetail('resume', oState.state, oState.state, how), false);
  oState.resume(oState.state, how);
}

function getEventDetail(action, state, relatedState, how) {
  return {
    event: `${action}${state}Event`,
    relatedState,
    state,
    action,
    how
  }
}

function checkState(states, state, fn) {
  if (!states.started)
    throw new Error(`micosmo:system:states:${fn}: Application has not been started. Attempting to enter state '${state}'`);
  const oState = states.registeredStates[state];
  if (!oState)
    throw new Error(`micosmo:system:states:${fn}: State '${state}' has not been implemented`);
  return oState;
}

function noop() {};

aframe.registerComponent("states", {
  schema: { type: 'string', default: '' },
  update(oldData) {
    if (oldData && oldData.length > 0)
      throw new Error(`micosmo:component:states:update: Component schema cannot be updated`);
    if (this.data.length === 0)
      throw new Error(`micosmo:component:states:init: No states defined`);
    onLoadedDo(() => registerStates(this.system, this.el, this.data.split(',').map(s => s.trim())));
  }
});

function registerStates(states, el, stateNames) {
  const regStates = states.registeredStates;
  const components = el.components;
  stateNames.forEach(name => {
    const state = `State${name}`;
    for (const compName in components) {
      const comp = components[compName];
      const compState = comp[state];
      if (!compState)
        continue;
      if (regStates[name])
        throw new Error(`micosmo:component:states:registerStates: State '${state}' has already been defined. Component(${comp.attrName})`);
      const oState = copyValues(StateTemplate);
      oState.state = name;
      for (const prop in compState) {
        if (!oState[prop] || typeof compState[prop] !== 'function')
          throw new Error(`micosmo:component:states:registerStates: State '${name}' has an invalid property '${prop}'. Component(${comp.attrName})`);
        oState[prop] = compState[prop].bind(comp);
      }
      regStates[name] = oState;
    }
    if (!regStates[name])
      throw new Error(`micosmo:component:states:registerStates: State '${state}' was not defined. Entity(${el.id || '<noid>'})`);
  });
}
