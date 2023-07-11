import { useEffect, useState, useRef } from 'react';
import PQueue from 'p-queue';
import { useSelector, useDispatch } from 'react-redux';
import { selectDate as selectDateAction } from '../../modules/date/actions'
import { play as playAnimationAction } from '../../modules/animation/actions';
import { promiseImageryForTime } from '../../modules/map/util'
import util from '../../util/util';

const CONCURRENT_REQUESTS = 3;
const toString = (date) => util.toISOStringSeconds(date);
const toDate = (dateString) => util.parseDateUTC(dateString);

function EICPlayQueue () {
  // actions
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const playAnimation = () => { dispatch(playAnimationAction()); };
  // redux state
  const animationDatesAsStrings = useSelector((state) => state.ui.animationDates);
  const animationDatesAsDateObjects = animationDatesAsStrings.map(toDate);
  const numberOfFrames = animationDatesAsStrings.length;
  const startDateAsObject = animationDatesAsDateObjects[0];
  const endDateAsObject = animationDatesAsDateObjects[numberOfFrames - 1];
  const isPlaying = useSelector((state) => state.animation.isPlaying);
  const state = useSelector((state) => state);
  // component state & refs
  const [animationStarted, setAnimationStarted] = useState(false);
  const playingDateObj = useRef(startDateAsObject);
  const inQueueObject = useRef({});
  const bufferObject = useRef({});
  const bufferArray = useRef([]);
  const preloadComplete = useRef(false);
  const animationIsPlaying = useRef(false);

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

  // accepts a date object
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
    if (preloadComplete.current) {
      console.log('Playing...')
      playAnimation()
      animate()
    }
  }

  function isPreloadSufficient() {
    console.log('Checking preload sufficiency...')
    const bufferedLastDate = bufferObject.current[toString(endDateAsObject)]

    if (bufferedLastDate){
      console.log('preload sufficient!')
    } else {
      console.log('preload insufficient!')
    }

    return bufferedLastDate
  }

  function checkShouldPlay() {
    console.log('Checking should play...')
    const preloadSufficient = isPreloadSufficient();
    if (preloadSufficient){
      animationIsPlaying.current = true;
      return play()
    } else {
      // recursively check if preload is sufficient in 1 second intervals
      setTimeout(() => {
        checkShouldPlay();
      } , 1000)
    }
  }

  function animationInterval(ms, player) {
    const start = document.timeline.currentTime;
    const frame = (time) => {
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
        // delay for end of loop...
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
      const currentDateObj = playingDateObj.current;
      nextDateAsDateObject =  getNextDate(currentDateObj);
      nextDateAsString = toString(nextDateAsDateObject);

      if (nextDateAsDateObject > endDateAsObject) {
        // looping...
        playingDateObj.current = startDateAsObject;
        return;
      }

      if (isPlaying) selectDate(currentDateObj);

      currentDateStr = nextDateAsString;
      playingDateObj.current = nextDateAsDateObject;

      // leaving this incase we don't want to preload all dates
      // if(!bufferObject.current[nextDateAsString]){
      //   console.log('Playback caught up with buffer :(')
      // }
    }

    const animIntervalMS = 166;
    animationInterval(animIntervalMS, player);
  }

  return null;
}

export default EICPlayQueue;
