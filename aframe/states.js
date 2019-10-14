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
*     dispersePattern: Method pattern for disperseEvent. %1 for action and %2 for the state
*     changeEvent: Name of the change event.
*
*  Events are non bubbling and are emitted to the states element.
*  The event detail object:
*     {
*       disperseEvent: <meth>, // Default method to disperse the event.
*       states: <object>, // The owning states component object of this event detail.
*       from: <object>, // Object defining the 'from' state context.
*       to: <object>, // Object defining the 'to' state context.
*       op: 'chain' | 'call' | 'return'
*     }
*  from/to object:
*     {
*       state: <state>, // The transition state.
*       action: 'enter' | 'exit' | <user defined>, // The transition action.
*       <name>: <value>, // User defined name/values for the event.
*     }
*  User defined action and name/value pairs are passed to the chain, call, return operations.
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
    this.intState = this.data._state;
    this.intState.currentState = undefined;
    this.stack = [];
    this.evtDetail = { disperseEvent, states: this, from: undefined, to: undefined, op: undefined };
  },
  update() {
    if (!this.data.event)
      throw new Error(`micosmo:component:states:update: 'event' name is required.`);
    if (!this.data.dispersePattern)
      throw new Error(`micosmo:component:states:update: 'dispersePattern' is required.`);
    this.intState.disperseFormat = parsePattern(this.data.dispersePattern, this.intState.disperseFormat);
  },
  chain(state, fromCtxt, toCtxt) { emitStateChange(this, this.intState.currentState, state, fromCtxt, toCtxt, 'chain') },
  call(state, fromCtxt, toCtxt) { pushStateAndEmit(this, state, 'push', 'pop') },
  pop() { popStateAndEmit(this, 'pop', 'push') },

  addEventDetail(o) {
    for (const prop in o) {
      if (!hasOwnProperty(o, prop))
        continue;
      if (hasOwnProperty(this.evtDetails, prop)) {
        // Must be chain, push, pop, pause or resume.
        const o1 = o[prop];
        for (const prop1 in o1) {
          if (!hasOwnProperty(o1, prop1))
            continue;
          if (prop1 === 'enter' || prop1 === 'exit') {
            // Add/update properties to either enter or exit sub-object for given operation
            copyValues(o1[prop1], this.evtDetails[prop][prop1]);
            continue;
          }
          // Add/update a property at the root level of evt.detail for given operation
          this.evtDetails[prop][prop1] = o1[prop1];
        }
        continue;
      }
      // Add/update a property at the root level for all operation evt.detail objects.
      const v = o[prop];
      ['chain', 'push', 'pop', 'pause', 'resume'].forEach(op => {
        this.evtDetails[op][prop] = v;
      });
    }
  }
});

function pushStateAndEmit(states, state, opPush, opPop) {
  const o = requestObject(); o.opPush = opPush; o.opPop = opPop; o.state = states.intState.currentState;
  states.stack.push(o);
  emitStateChange(states, o.state, state, opPush);
}

function popStateAndEmit(states, opPop, opPush) {
  if (this.stack.length === 0)
    throw new Error(`micosmo:component:states:${opPop}: There is no ${opPush} state to ${opPop}.`);
  const o = this.stack.pop();
  if (o.opPush !== opPush)
    throw new Error(`micosmo:component:states:${opPop}: Expecting ${opPush} on state stack. Found ${o.opPush}.`);
  emitStateChange(this, this.intState.currentState, o.state, opPop);
  returnObject(o);
}

function emitStateChange(states, fromState, toState, op) {
  const data = states.data;
  if (!data.list.includes(toState))
    throw new Error(`micosmo:component:states:emitStateChange: State '${toState}' is not defined`);
  const detail = states.evtDetails[op];
  detail.fromState = fromState; detail.toState = toState;
  states.el.emit(data.event, detail, false);
  states.intState.currentState = toState;
}

function parsePattern(dispersePattern, disperseFormat = { sb: StringBuilder(), idxAction: undefined, idxState: undefined }) {
  const sb = disperseFormat.sb.clear(); disperseFormat.idxAction = disperseFormat.idxState = 0;
  const idxAction = dispersePattern.indexOf('%1'); const idxState = dispersePattern.indexOf('%2');
  if (idxAction < 0 && idxState < 0)
    throw new Error(`micosmo:component:states:parsePattern: A 'dispersePattern' requires an action '%1' or state '%2' in pattern`);
  let order;
  if (idxAction < 0)
    order = [idxState, 'idxState'];
  else if (idxState < 0)
    order = [idxAction, 'idxAction'];
  else
    order = idxAction < idxState ? [idxAction, 'idxAction', idxState, 'idxState'] : [idxState, 'idxState', idxAction, 'idxAction'];
  let iLastOrder = 0;
  if (order[0] > 0)
    sb.append(dispersePattern.substring(0, order[0]));
  disperseFormat[order[1]] = sb.segmentCount(); sb.append(''); // '' filler for actual value
  if (order[2]) {
    iLastOrder = 2;
    if (order[2] > order[0] + 2)
      sb.append(dispersePattern.substring(order[0] + 2, order[2]));
    disperseFormat[order[3]] = sb.segmentCount(); sb.append(''); // '' filler for actual value
  }
  if (order[iLastOrder] + 2 < dispersePattern.length)
    sb.append(dispersePattern.substring(order[iLastOrder] + 2)); // Append the remainder of the pattern.
  return disperseFormat;
}

method(disperseEvent);
function disperseEvent(evt, oTgt) {
  let sMeth;
  const disperseFormat = this.states.intState.disperseFormat;
  disperseFormat.sb.atPut(disperseFormat.idxAction, 'exit').atPut(disperseFormat.idxState, this.fromState);
  if (this.fromState && oTgt[sMeth = disperseFormat.sb.toString()])
    oTgt[sMeth](evt);
  disperseFormat.sb.atPut(disperseFormat.idxAction, 'enter').atPut(disperseFormat.idxState, this.toState);
  if (oTgt[sMeth = disperseFormat.sb.toString()])
    oTgt[sMeth](evt);
}

method(defaultEnterAction);
function defaultEnterAction(evt, ...els) {
  if (els.length === 1 && Array.isArray(els[0])) els = els[0];
  els.forEach(el => {
    el.object3D.visible = true;
    el.play();
  })
}

method(defaultExitAction);
function defaultExitAction(evt, ...els) {
  if (els.length === 1 && Array.isArray(els[0])) els = els[0];
  els.forEach(el => {
    el.object3D.visible = false;
    el.pause();
  })
}

method(pauseExitAction);
function pauseExitAction(evt, ...els) {
  if (els.length === 1 && Array.isArray(els[0])) els = els[0];
  els.forEach(el => el.pause());
}

method(resumeEnterAction);
function resumeEnterAction(evt, ...els) {
  if (els.length === 1 && Array.isArray(els[0])) els = els[0];
  els.forEach(el => el.play());
}

method(noopAction);
function noopAction(evt, els) {}
