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

const testDatesSubdaily = [
  "2023-07-11T01:30:00Z",
  "2023-07-11T02:10:00Z",
  "2023-07-11T02:40:00Z",
  "2023-07-11T06:10:00Z",
  "2023-07-11T07:00:00Z",
  "2023-07-11T07:30:00Z"
]

const testDatesDaily = [
  "2023-06-11T10:10:00Z",
  "2023-06-12T10:10:00Z",
  "2023-06-22T10:10:00Z",
  "2023-06-23T10:10:00Z",
  "2023-07-03T10:10:00Z",
  "2023-07-09T10:10:00Z",
  "2023-07-11T10:10:00Z"
]

function EICPlayQueue () {
  // actions
  const dispatch = useDispatch();
  const selectDate = (date) => { dispatch(selectDateAction(date)); };
  const playAnimation = () => { dispatch(playAnimationAction()); };
  // redux state
  const animationDatesAsStrings = useSelector((state) => state.ui.animationDates);
  // FOR TESTING
  // const animationDatesAsStrings = testDatesSubdaily;
  // const animationDatesAsStrings = testDatesDaily;
  const animationDatesAsDateObjects = animationDatesAsStrings.map(toDate);
  const numberOfFrames = animationDatesAsStrings.length;
  const startDateAsObject = animationDatesAsDateObjects[0];
  const endDateAsObject = animationDatesAsDateObjects[numberOfFrames - 1];
  const isPlaying = useSelector((state) => state.animation.isPlaying);
  const eicMode = useSelector((state) => state.ui.eic);
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
    // const interval = eicMode === 'da' ? 'day' : 'minute';
    // const delta = eicMode === 'da' ? 1 : 10;
    // console.log('getting next date for', date)

    // return util.dateAdd(date, interval, delta);

    const currentIndex = animationDatesAsDateObjects.findIndex(function(dateObject) {
      // Compare the date parameter with each date object in the array
      return dateObject.getTime() === date.getTime();
    });

    // if the date is not found, we find the next date so we can compare correctly in getNextBufferDate()
    if (animationDatesAsDateObjects[currentIndex + 1] === undefined){
      const interval = eicMode === 'da' ? 'day' : 'minute';
      const delta = eicMode === 'da' ? 1 : 10;

      return util.dateAdd(date, interval, delta);
    }

    console.log('currentIndex', currentIndex)
    console.log('animationDatesAsDateObjects[currentIndex + 1]', animationDatesAsDateObjects[currentIndex + 1])

    return animationDatesAsDateObjects[currentIndex + 1];
  }

  function getNextBufferDate() {
    const strDate = bufferArray.current[bufferArray.current.length - 1];
    const lastInBuffer = toDate(strDate)
    const nextDate = getNextDate(lastInBuffer)
    if ((lastInBuffer >= endDateAsObject) || (nextDate > endDateAsObject) || (nextDate === undefined)) {
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
    if(!preloadComplete.current) return initialPreload();

    const nextInQueue = toString(getNextBufferDate());

    if (!bufferObject.current[nextInQueue] && !inQueueObject.current[nextInQueue]) addItemToQueue();
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
    // if we want to change the min buffer amount from all dates to something else (half, 1/4, etc...)
    // we can change this variable
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
