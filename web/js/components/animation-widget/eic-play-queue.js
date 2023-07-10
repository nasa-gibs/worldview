import React, { useEffect, useState, useRef } from 'react';
import PQueue from 'p-queue';
import { useSelector, useDispatch } from 'react-redux';
import { selectDate as selectDateAction } from '../../modules/date/actions'
import { play as playAnimationAction } from '../../modules/animation/actions';
// requires (state, date)
import { promiseImageryForTime } from '../../modules/map/util'
import util from '../../util/util';

const MIN_REQUEST_TIME_MS = 200;
const CONCURRENT_REQUESTS = 3;
const toString = (date) => util.toISOStringSeconds(date);
const toDate = (dateString) => util.parseDateUTC(dateString);
const speed = 6;

const getInitialBufferSize = (numberOfFrames, speed) => {
  const defaultSize = 10;
  const buffer = defaultSize + (speed * 1.5);
  return numberOfFrames < buffer ? numberOfFrames : buffer;
};

function EICPlayQueue () {
  // actions
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const playAnimation = () => { dispatch(playAnimationAction()); };
  // redux state
  // as iso strings
  const animationDatesAsStrings = useSelector((state) => state.ui.animationDates);
  const animationDatesAsDateObjects = animationDatesAsStrings.map(toDate);
  const numberOfFrames = animationDatesAsStrings.length;
  const startDateAsString = animationDatesAsStrings[0];
  const endDateAsString = animationDatesAsStrings[numberOfFrames - 1];
  const startDateAsObject = animationDatesAsDateObjects[0];
  const endDateAsObject = animationDatesAsDateObjects[numberOfFrames - 1];
  const isLoopActive = useSelector((state) => state.animation.loop);
  const state = useSelector((state) => state);
  // component state
  const [animationStarted, setAnimationStarted] = useState(false);
  // refs
  const playingDateIndex = useRef(0);
  const loadedItems = useRef(0);
  const abortController = useRef(null);
  const inQueueObject = useRef({});
  const bufferObject = useRef({});
  // string dates
  const bufferArray = useRef([]);
  // local variables
  const initialBufferSize = getInitialBufferSize(numberOfFrames, speed);
  const queue = new PQueue({
    concurrency: CONCURRENT_REQUESTS,
    timeout: 3000,
  });

  useEffect(() => {
    if (animationDatesAsStrings.length && !animationStarted){
      setAnimationStarted(true);
      animate();
    }
  }, [animationDatesAsStrings]);

  // called in a loop from initialPreload
  async function addDate(objDate) {
    const strDate = toString(objDate)
    console.log(`#3-Adding date for ${strDate}...`)

    inQueueObject.current[strDate] = objDate;
    bufferArray.current.push(strDate);

    await queue.add(async () => {
      await promiseImageryForTime(state, objDate, 'active');
      loadedItems.current += 1;
      return strDate;
    });

    bufferObject.current[strDate] = strDate;
    delete inQueueObject.current[strDate];
  }

  function initialPreload() {
    console.log('#3 Initial preload...')
    for (let i = 0; i < numberOfFrames; i += 1) {
      const objDate = animationDatesAsDateObjects[i];
      addDate(objDate)
    }
  }

  // called from getNextBufferDate
  function getNextDate(date) {
    // NEED TO UNHARDCODE THESE VARIABLES
    const interval = 'day';
    const delta = 1;

    return util.dateAdd(date, interval, delta);
  }

  function getNextBufferDate() {
    const strDate = bufferArray.current[bufferArray.current.length - 1];
    const lastInBuffer = toDate(strDate)
    const nextDate = getNextDate(lastInBuffer)
    if (lastInBuffer >= endDateAsObject || nextDate > endDateAsObject) {
      return startDateAsObject;
    }
    return nextDate;
  }

  function addItemToQueue() {
    const nextDate = getNextBufferDate();
    const nextDateAsString = toString(nextDate);
    const dateInRange = nextDate <= endDateAsObject && nextDate >= startDateAsObject;
    const shouldQueue = !inQueueObject.current[nextDateAsString] && !bufferObject.current[nextDateAsString];

    if (shouldQueue && dateInRange) {
      addDate(nextDate);
    }
  }

  function checkQueue() {
    console.log('#2 Checking queue...')
    // If nothing has been loaded yet we perform the initial preload
    if (!bufferArray[0] && !inQueueObject[animationDatesAsDateObjects[playingDateIndex]]){
      initialPreload();
    }

    const nextInQueue = toString(getNextBufferDate());

    if (!bufferObject.current[nextInQueue] && !inQueueObject.current[nextInQueue]) {
      addItemToQueue();
    }
  }

  function animate() {
    console.log('#1 Animating...')
    let currentDateAsString = animationDatesAsStrings[playingDateIndex];
    let nextDateAsDateObject;
    let nextDateAsString;

    const player = () => {
      // if (abortController.current?.signal?.aborted) return;
      // const currentDateAsDateObject = animationDatesAsDateObjects[playingDateIndex];
      // nextDateAsDateObject = animationDatesAsDateObjects[playingDateIndex + 1];
      // nextDateAsString = animationDatesAsStrings[playingDateIndex + 1];
      checkQueue()
      // ..continue
    }

    player()

  }

  return null;
}

export default EICPlayQueue;
