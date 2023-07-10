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
  const isLoopActive = useSelector((state) => state.animation.loop);
  const state = useSelector((state) => state);
  // component state
  const [animationStarted, setAnimationStarted] = useState(false);
  // refs
  const playingDateIndex = useRef(0);
  const abortController = useRef(null);
  const inQueueObject = useRef({});
  const bufferObject = useRef({});
  const bufferArray = useRef([]);
  // local variables
  const initialBufferSize = getInitialBufferSize(numberOfFrames, speed);
  const queue = new PQueue({
    concurrency: CONCURRENT_REQUESTS,
    timeout: 3000,
  });

  useEffect(() => {
    if (animationDatesAsStrings && !animationStarted){
      setAnimationStarted(true);
      animate();
    }
  }, [animationDatesAsStrings]);

  // called in a loop from initialPreload
  async function addDate(index) {
    const strDate = animationDatesAsStrings[index];
    const objDate = animationDatesAsDateObjects[index];
    console.log(`#3-${index} Adding date for ${strDate}...`)

    await queue.add(async () => {
      await promiseImageryForTime(state, objDate, 'active');
      return strDate;
    });

    bufferObject.current[strDate] = strDate;
    delete inQueueObject.current[strDate];
    // const currentBufferSize = util.objectLength(bufferObject.current);
  }


  function initialPreload() {
    console.log('#3 Initial preload...')
    // this might need to be i < frameDates.length
    for (let i = 0; i < numberOfFrames; i += 1) {
      addDate(i)
    }

  }

  function checkQueue() {
    console.log('#2 Checking queue...')
    if (!bufferArray[0] && !inQueueObject[animationDatesAsDateObjects[playingDateIndex]]){
      const currentDate = animationDatesAsDateObjects[playingDateIndex];
      initialPreload();
    }
    // ..continue
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
