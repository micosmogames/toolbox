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
*       op: 'chain' | 'push' | 'pop' | 'pause' | 'resume'
*     }
*/
"use strict";

import aframe from 'aframe';
import { requestObject, returnObject, hasOwnProperty } from '@micosmo/core/object';
import { declareMethods, method } from '@micosmo/core/method';
import { StringBuilder } from '@micosmo/core/string';
import { copyValues } from '@micosmo/core/replicate';
import { createSchemaPersistentObject } from './lib/utils';

declareMethods(disperseEvent, defaultEnterAction, defaultExitAction, pauseExitAction, resumeEnterAction, noopAction);

aframe.registerComponent("states", {
  schema: {
    list: { default: [] },
    dispersePattern: { default: '%1%2' }, // Pattern for generic state handler model. %1 - enter/exit, %2 - state
    event: { default: 'statechanged' },
  },
  updateSchema(data) {
    createSchemaPersistentObject(this, data, '_state');
  },
  multiple: true,
  init() {
    this.state = this.data._state;
    this.state.currentState = undefined;
    this.stack = [];
    this.evtDetails = {
      chain: { disperseEvent, enterAction: defaultEnterAction, exitAction: defaultExitAction },
      push: { disperseEvent, enterAction: defaultEnterAction, exitAction: defaultExitAction },
      pop: { disperseEvent, enterAction: defaultEnterAction, exitAction: defaultExitAction },
      pause: { disperseEvent, enterAction: noopAction, exitAction: pauseExitAction },
      resume: { disperseEvent, enterAction: resumeEnterAction, exitAction: noopAction }
    }
  },
  update() {
    if (!this.data.event)
      throw new Error(`micosmo:component:states:update: 'event' name is required.`);
    if (!this.data.dispersePattern)
      throw new Error(`micosmo:component:states:update: 'dispersePattern' is required.`);
    this.state.disperseFormat = parsePattern(this.state.dispersePattern, this.state.disperseFormat);
  },
  chain(state) { emitStateChange(this, this.state.currentState, state, 'chain') },
  push(state) { pushStateAndEmit(this, state, 'push', 'pop') },
  pop() { popStateAndEmit(this, 'pop', 'push') },
  pause(state) { pushStateAndEmit(this, state, 'pause', 'resume') },
  resume() { popStateAndEmit(this, 'resume', 'pause') },

  addEventDetail(o) {
    for (const prop in o) {
      if (!hasOwnProperty(o, prop))
        continue;
      if (hasOwnProperty(this.eventDetails, prop))
    }
  }
});

function pushStateAndEmit(states, state, opPush, opPop) {
  const o = requestObject(); o.opPush = opPush; o.opPop = opPop; o.state = states.state.currentState;
  states.stack.push(o);
  emitStateChange(states, o.state, state, opPush);
}

function popStateAndEmit(states, opPop, opPush) {
  if (this.stack.length === 0)
    throw new Error(`micosmo:component:states:${opPop}: There is no ${opPush} state to ${opPop}.`);
  const o = this.stack.pop();
  if (o.opPush !== opPush)
    throw new Error(`micosmo:component:states:${opPop}: Expecting ${opPush} on state stack. Found ${o.opPush}.`);
  emitStateChange(this, this.state.currentState, o.state, opPop);
  returnObject(o);
}

function emitStateChange(states, fromState, toState, op) {
  const data = states.data;
  if (!data.list.includes(toState))
    throw new Error(`micosmo:component:states:emitStateChange: State '${toState}' is not defined`);
  const detail = requestObject();
  detail.fromState = fromState; detail.toState = toState; detail.op = op;
  states.el.emit(data.event, detail, false);
  states.state.currentState = toState;
  returnObject(detail);
}

function parsePattern(dispersePattern, disperseFormat = { sb: StringBuilder(), idxAction: 0, idxState: 0 }) {
  const sb = disperseFormat.sb.clear(); disperseFormat.idxAction = disperseFormat.idxState = 0;
  const idxAction = dispersePattern.indexOf('%1'); const idxState = dispersePattern.indexOf('%2');
  if (idxAction < 0 || idxState < 0)
    throw new Error(`micosmo:component:states:parsePattern: A 'dispersePattern' requires both an action '%1' and state '%2' in pattern`);
  const order = idxAction < idxState ? [idxAction, 'idxAction', idxState, 'idxState'] : [idxState, 'idxState', idxAction, 'idxAction'];
  if (order[0] > 0)
    sb.append(dispersePattern.substring(0, order[0]));
  disperseFormat[order[1]] = sb.segmentCount(); sb.append(''); // '' filler for actual value
  if (order[3] > order[0] + 2)
    sb.append(dispersePattern.substring(order[0] + 2, order[3]));
  disperseFormat[order[4]] = sb.segmentCount(); sb.append(''); // '' filler for actual value
  if (order[3] + 2 < dispersePattern.length)
    sb.append(dispersePattern.substring(order[3] + 2)); // Append the remainder of the pattern.
  return disperseFormat;
}

method(disperseEvent);
function disperseEvent(oTgt) {
  let sMeth;
  const disperseFormat = this.states.state.disperseFormat;
  if (this.fromState && oTgt[sMeth = disperseFormat.toString]) {
    disperseFormat.sb.atPut(disperseFormat.idxAction, 'exit').atPut(disperseFormat.idxState, this.fromState);
    oTgt[sMeth](this);
  }
  disperseFormat.sb.atPut(disperseFormat.idxAction, 'enter').atPut(disperseFormat.idxState, this.toState);
  if (oTgt[sMeth = disperseFormat.toString])
    oTgt[sMeth](this);
}

method(defaultEnterAction);
function defaultEnterAction(els) {
  els.forEach(el => {
    el.object3D.visible = true;
    el.play();
  })
}

method(defaultExitAction);
function defaultExitAction(els) {
  els.forEach(el => {
    el.object3D.visible = false;
    el.pause();
  })
}

method(pauseExitAction);
function pauseExitAction(els) {
  els.forEach(el => el.pause());
}

method(resumeEnterAction);
function resumeEnterAction(els) {
  els.forEach(el => el.play());
}

method(noopAction);
function noopAction() {}
