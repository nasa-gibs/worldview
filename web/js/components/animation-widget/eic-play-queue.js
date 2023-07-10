import React, { useEffect, useState } from 'react';
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
  const animationDates = useSelector((state) => state.ui.animationDates);
  const numberOfFrames = animationDates.length;
  const startDate = animationDates[0];
  const endDate = animationDates[numberOfFrames - 1];
  const isLoopActive = useSelector((state) => state.animation.loop);
  // component state
  const [animationStarted, setAnimationStarted] = useState(false);
  const [playingDate, setPlayingDate] = useState(startDate);
  const [bufferIndex, setBufferIndex] = useState(0);
  // local variables
  const initialBufferSize = getInitialBufferSize(numberOfFrames, speed);
  const queue = new PQueue({
    concurrency: CONCURRENT_REQUESTS,
    timeout: 3000,
  })

  return null;
}

export default EICPlayQueue;
