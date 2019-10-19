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
*     dispersePattern: Method pattern for disperseEvent. %A for action and %S for the state
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
import { requestObject, returnObject } from '@micosmo/core/object';
import { declareMethods, method } from '@micosmo/core/method';
import { StringBuilder, parseNameValues } from '@micosmo/core/string';
import { copyValues } from '@micosmo/core/replicate';
import { createSchemaPersistentObject } from './lib/utils';

declareMethods(disperseEvent);

aframe.registerComponent("states", {
  schema: {
    list: { default: [] },
    dispersePattern: { default: '%A%S' }, // Pattern for generic state handler model. %A - action, %S - state
    event: { default: 'statechanged' },
  },
  updateSchema(data) {
    createSchemaPersistentObject(this, data, '_state');
  },
  multiple: true,
  init() {
    this.intState = this.data._state;
    this.intState.currentState = undefined;
    this.callStack = [];
  },
  update() {
    if (!this.data.event)
      throw new Error(`micosmo:component:states:update: 'event' name is required.`);
    if (!this.data.dispersePattern)
      throw new Error(`micosmo:component:states:update: 'dispersePattern' is required.`);
    this.intState.disperseFormat = parsePattern(this.data.dispersePattern, this.intState.disperseFormat);
  },
  chain(state, fromCtxt, toCtxt) { emitStateChange(this, this.intState.currentState, state, fromCtxt, toCtxt, 'chain') },
  call(state, fromCtxt, toCtxt) { callAndEmit(this, state, fromCtxt, toCtxt) },
  return(state, fromCtxt, toCtxt) { returnAndEmit(this, state, fromCtxt, toCtxt) },
});

function callAndEmit(states, state, fromCtxt, toCtxt) {
  const curState = states.intState.currentState;
  states.callStack.push(curState);
  emitStateChange(states, curState, state, fromCtxt, toCtxt, 'call');
}

function returnAndEmit(states, state, fromCtxt, toCtxt) {
  if (states.callStack.length === 0)
    throw new Error(`micosmo:component:states:returnAndEmit: Call stack is empty.`);
  const oldState = states.callStack.pop();
  emitStateChange(states, states.intState.currentState, state || oldState, fromCtxt, toCtxt, 'return');
}

function emitStateChange(states, fromState, toState, fromCtxt, toCtxt, op) {
  if (!states.data.list.includes(toState))
    throw new Error(`micosmo:component:states:emitStateChange: State '${toState}' is not defined`);

  const evtDetail = requestObject();
  evtDetail.disperseEvent = disperseEvent; evtDetail.states = states; evtDetail.op = op;
  evtDetail.from = createContextObject(fromCtxt, fromState, 'exit');
  evtDetail.to = createContextObject(toCtxt, toState, 'enter');

  states.intState.currentState = toState;
  states.el.emit(states.data.event, evtDetail, false);
  returnObject(evtDetail); // Will automatically cleanup from/to context objects
}

function createContextObject(ctxt, state, defAction) {
  const oCtxt = requestObject();
  oCtxt.state = state || '<nos>';
  if (ctxt) typeof ctxt === 'string' ? parseNameValues(ctxt, oCtxt) : copyValues(ctxt, oCtxt);
  if (!oCtxt.action) oCtxt.action = defAction;
  return oCtxt;
}

function parsePattern(dispersePattern, disperseFormat = { sb: StringBuilder(), idxAction: undefined, idxState: undefined }) {
  const sb = disperseFormat.sb.clear(); disperseFormat.idxAction = disperseFormat.idxState = 0;
  const idxAction = dispersePattern.indexOf('%A'); const idxState = dispersePattern.indexOf('%S');
  if (idxAction < 0 && idxState < 0)
    throw new Error(`micosmo:component:states:parsePattern: A 'dispersePattern' requires an action '%A' or state '%S' in pattern`);
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
  const disperseFormat = this.states.intState.disperseFormat;
  disperseMethod(disperseFormat, evt, oTgt, this.from);
  disperseMethod(disperseFormat, evt, oTgt, this.to);
}

function disperseMethod(disperseFormat, evt, oTgt, oCtxt) {
  let sMeth = getDisperseMethodName(disperseFormat, oCtxt.action, oCtxt.state);
  if (oTgt[sMeth]) return oTgt[sMeth](evt);
  if (!oCtxt.defaultAction) return;
  sMeth = getDisperseMethodName(disperseFormat, oCtxt.defaultAction, oCtxt.state);
  if (oTgt[sMeth]) oTgt[sMeth](evt);
}

function getDisperseMethodName(disperseFormat, action, state) {
  if (disperseFormat.idxAction >= 0) disperseFormat.sb.atPut(disperseFormat.idxAction, action);
  if (disperseFormat.idxState >= 0) disperseFormat.sb.atPut(disperseFormat.idxState, state);
  return disperseFormat.sb.toString();
}
