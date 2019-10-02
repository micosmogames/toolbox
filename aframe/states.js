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
*     enterEvent: Pattern for the enter event. %% makes position of enter state
*     exitEvent: Pattern for the exit event. %% makes position of exit state
*     changeEvent: Name of the change event.
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
    enterEvent: { default: '' }, // Allow patterns of the form xxxx%%xxxx. Substitutes %% for state
    exitEvent: { default: '' }, // Allow patterns of the form xxxx%%xxxx. Substitutes %% for state
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
  update() {
    this.state.enterData = parsePattern(this.state.enterData, this.data.enterEvent);
    this.state.exitData = parsePattern(this.state.exitData, this.data.exitEvent);
  },
  chain(state) { console.log('state', state); emitStateChange(this, this.state.currentState, state, 'chain') },
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
    el.emit(getEventName(states.state.exitData, fromState), detail, false);
  if (data.enterEvent !== '')
    el.emit(getEventName(states.state.enterData, toState), detail, false);
  if (data.changeEvent !== '')
    el.emit(data.changeEvent, detail, false);
  states.state.currentState = toState;
  returnObject(detail);
}

function parsePattern(eventData, eventPattern) {
  if (!eventData)
    eventData = [];
  const i = eventPattern.indexOf('%%');
  if (i < 0) {
    eventData.length = 1; eventData[0] = eventPattern;
    return eventData;
  }
  eventData[0] = eventPattern.substring(0, i);
  eventData[1] = eventPattern.substring(i + '%%'.length);
  return eventData;
}

function getEventName(eventData, state) {
  return eventData.length === 1 ? eventData[0] : `${eventData[0]}${state}${eventData[1]}`;
}
