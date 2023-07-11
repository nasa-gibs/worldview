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
  const startDateAsObject = animationDatesAsDateObjects[0];
  const endDateAsObject = animationDatesAsDateObjects[numberOfFrames - 1];
  const isLoopActive = useSelector((state) => state.animation.loop);
  const isPlaying = useSelector((state) => state.animation.isPlaying);
  const state = useSelector((state) => state);
  // component state
  const [animationStarted, setAnimationStarted] = useState(false);
  // refs
  const playingDateObj = useRef(startDateAsObject);
  const abortController = useRef(null);
  const inQueueObject = useRef({});
  const bufferObject = useRef({});
  // string dates
  const bufferArray = useRef([]);
  const preloadComplete = useRef(false);
  // local variables
  const initialBufferSize = getInitialBufferSize(numberOfFrames, speed);
  const queue = new PQueue({
    concurrency: CONCURRENT_REQUESTS,
    timeout: 3000,
  });

  useEffect(() => {
    if (animationDatesAsStrings.length && !animationStarted){
      console.log('useEffect hook...')
      setAnimationStarted(true);
      checkQueue();
      checkShouldPlay();
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
      return strDate;
    });

    bufferObject.current[strDate] = strDate;
    delete inQueueObject.current[strDate];
  }

  function initialPreload() {
    console.log('Initial preload...')
    for (let i = 0; i < numberOfFrames; i += 1) {
      const objDate = animationDatesAsDateObjects[i];
      addDate(objDate)
    }
    preloadComplete.current = true;
  }

  // called from getNextBufferDate
  // accepts a date object!!!
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
    if ((lastInBuffer >= endDateAsObject) || (nextDate > endDateAsObject)) {
      return startDateAsObject;
    }
    return nextDate;
  }

  function addItemToQueue() {
    const nextDate = getNextBufferDate();
    const nextDateAsString = toString(nextDate);
    const dateInRange = nextDate <= endDateAsObject && nextDate >= startDateAsObject;
    const shouldQueue = !inQueueObject.current[nextDateAsString] && !bufferObject.current[nextDateAsString];

    console.log(`Adding ${nextDate} to queue from addItemToQueue...`)

    if (shouldQueue && dateInRange) {
      addDate(nextDate);
    }
  }

  function checkQueue() {
    console.log('Checking queue...')
    if(!preloadComplete.current){
      initialPreload();
      return;
    }

    const nextInQueue = toString(getNextBufferDate());

    if (!bufferObject.current[nextInQueue] && !inQueueObject.current[nextInQueue]) {
      addItemToQueue();
    }
  }

  function play() {
    if (!animationStarted && preloadComplete.current) {
      console.log('Playing...')
      setAnimationStarted(true);
      playAnimation()
      animate()
    }
  }

  function isPreloadSufficient() {
    console.log('Checking preload sufficiency...')
    const currentBufferSize = util.objectLength(bufferObject.current);
    if (currentBufferSize === numberOfFrames){
      return true;
    }
    if (currentBufferSize < initialBufferSize){
      return false;
    }
  }

  function checkShouldPlay() {
    console.log('Checking should play...')
    const restartLoop = playingDateObj.current.getTime() === startDateAsObject.getTime();
    const preloadSufficient = isPreloadSufficient();

    if (restartLoop || preloadSufficient){
      return play()
    }
  }

  // we don't really need this. We can just move the playingDateObj.current line to
  async function continueLoop() {
    console.log('Continuing loop...')
    const loopDelay = 1500;
    playingDateObj.current = startDateAsObject;
    setTimeout(() => {
      checkQueue();
    }, loopDelay)
  }

  function animationInterval(ms, player) {
    const start = document.timeline.currentTime;
    const frame = (time) => {
      if (abortController.current?.signal?.aborted) return;
      player(time);
      scheduleFrame(time)
    }

    const scheduleFrame = (time) => {
      const elapsedTime = time - start;
      const roundedElapsedTime = Math.round(elapsedTime / ms) * ms;
      const targetNext = start + roundedElapsedTime + ms;

      const currentDateObj = playingDateObj.current;
      const nextDateAsDateObject =  getNextDate(currentDateObj);
      let delay = targetNext - performance.now();
      if ((nextDateAsDateObject > endDateAsObject)) {
        console.log('nextDateAsObject', nextDateAsDateObject, 'vs endDateAsObject', endDateAsObject, 'vs currentDateObj', currentDateObj)
        delay = 1500
      }
      setTimeout(() => requestAnimationFrame(frame), delay);
    };
    scheduleFrame(start);
  }

  function animate() {
    console.log('#1 Animating...')
    let currentDateStr = toString(playingDateObj.current);
    let nextDateAsDateObject;
    let nextDateAsString;

    const player = () => {
      if (abortController.current?.signal?.aborted) return;
      const currentDateObj = playingDateObj.current;
      nextDateAsDateObject =  getNextDate(currentDateObj);
      nextDateAsString = toString(nextDateAsDateObject);

      if (nextDateAsDateObject > endDateAsObject) {
        continueLoop();
        return;
      }

      if (isPlaying) selectDate(currentDateObj);

      currentDateStr = nextDateAsString;
      playingDateObj.current = nextDateAsDateObject;

      if(!bufferObject.current[nextDateAsString]){
        console.log('Playback caught up with buffer :(')
      }
    }

    const animIntervalMS = 166;
    animationInterval(animIntervalMS, player);
  }

  return null;
}

export default EICPlayQueue;
