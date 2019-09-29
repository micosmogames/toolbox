/*
*  states.js
*
*  Component that manages the transition between application states that are defined on an element.
*  Multiple states components can be specified allowing localised state management. The main states
*  component would typically be located on the scene.
*
*  The transitions between states are initiated within the application itself by calling component
*  methods on a target states component. The states component supports multiple instances so can be
*  assigned unique ids.
*
*  Schema: {
*     list: An array or one or more state names for this state management component.
*     events: An array of one or more event names to raise. Defaults to ['exit:exit', 'enter:enter', 'statechanged].
*               The 'exit:<name>' and 'enter:<name>' events are emitted as '<name><state>State'
*               All other names are emitted as is.
*
*  Events are non bubbling and are emitted to the states element.
*  The event detail object:
*     {
*       fromState: <state>, // State that is being exited.
*       toState: <state>, // State that is being entered
*       how: 'chain' | 'push' | 'pop'
*     }
*/
"use strict";

import aframe from 'aframe';
import { requestObject, returnObject } from '@micosmo/core/object';
import { createSchemaPersistentObject } from './lib/utils';

aframe.registerComponent("states", {
  schema: {
    list: { default: [] },
    enterEvent: { default: '' }, // Allow patterns of the form xxxx%state%xxxx. Substitutes state
    exitEvent: { default: '' }, // Allow patterns of the form xxxx%state%xxxx. Substitutes state
    changeEvent: { default: 'statechanged' },
  },
  updateSchema(data) {
    createSchemaPersistentObject(this, data, '_state');
  },
  multiple: true,
  init() {
    this.state = this.data._state;
    this.state.currentState = undefined;
    this.stack = [];
  },
  chain(state) { emitStateChange(this, this.state.currentState, state, 'chain') },
  push(state) { this.stack.push(this.state.currentState); emitStateChange(this, this.state.currentState, state, 'push') },
  pop() {
    if (this.stack.length === 0)
      throw new Error(`micosmo:system:states:pop: There is no pushed state to pop.`);
    emitStateChange(this, this.state.currentState, this.stack.pop(), 'pop');
  }
});

function emitStateChange(states, fromState, toState, how) {
  const data = states.data;
  if (!data.list.includes(toState))
    throw new Error(`micosmo:component:states:emitStateChange: State '${toState}' is not defined`);
  const detail = requestObject();
  detail.fromState = fromState; detail.toState = toState; detail.how = how;
  const el = states.el;
  if (fromState && data.exitEvent !== '')
    el.emit(getEventName(data.exitEvent, fromState), detail, false);
  if (data.enterEvent !== '')
    el.emit(getEventName(data.enterEvent, toState), detail, false);
  if (data.changeEvent !== '')
    el.emit(data.changeEvent, detail, false);
  states.state.currentState = toState;
  returnObject(detail);
}

function getEventName(pattern, state) {
  const i = pattern.indexOf('%state%');
  return i < 0 ? pattern : pattern.substring(0, i) + state + pattern(i + '%state%'.length);
}
