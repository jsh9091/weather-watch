/*
 * MIT License
 *
 * Copyright (c) 2026 Joshua Horvath
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


import * as cbor from "cbor";
import { me as companion } from "companion";
import { outbox } from "file-transfer";
import { weather } from "weather";
import { dataFile, wakeTime } from "../common/constants";
import {
  sunny,
  mostlySunny,
  partlySunny,
  someClouds,
  hazySun,
  mostlyCloudy,
  cloudy,
  overcast,
  fog,
  showers,
  thunderstorms,
  rain,
  flurries,
  snow,
  ice,
  sleet,
  freezingRain,
  rainSnow,
  hot,
  cold,
  windy,
  clearNight,
  mostlyClear,
  cloudyNight,
  clouds,
  hazyMoon,
  cloudyShowers,
  cloudyStorms,
  cloudyFlurries,
  cloudySnow
} from "../common/weatherConditions";

/**
 * Update tempature data from phone.
 */
function refreshData() {
  weather
    .getWeatherData()
    .then((data) => {
      if (data.locations.length > 0) {
        sendData({
          temperature: Math.floor(data.locations[0].currentWeather.temperature),
          condition: findWeatherConditionName(data.locations[0].currentWeather.weatherCondition),
          conditionCode: data.locations[0].currentWeather.weatherCondition,
          location: data.locations[0].name,
          unit: data.temperatureUnit,
        });
      } else {
        console.warn("No data for this location.");
      }
    })
    .catch((ex) => {
      console.error(ex);
    });
}

/**
 * Send data from phone to watch.
 * @param {*} data
 */
function sendData(data) {
  outbox.enqueue(dataFile, cbor.encode(data)).catch((error) => {
    console.warn(`Failed to enqueue data. Error: ${error}`);
  });
}

/**
 * Determines name value to be displayed for current weather condition.
 * @param {*} conditionCode 
 * @returns 
 */
function findWeatherConditionName(conditionCode) {
  let name;
  switch (conditionCode) {
    case 1:
      name = sunny;
      break;
    case 2:
      name = mostlySunny;
      break;
    case 3:
      name = partlySunny;
      break;
    case 4:
      name = someClouds;
      break;
    case 5:
      name = hazySun;
      break;
    case 6:
      name = mostlyCloudy;
      break;
    case 7:
      name = cloudy;
      break;
    case 8:
      name = overcast;
      break;
    case 11:
      name = fog;
      break;
    case 12:
    case 13:
    case 14:
      name = showers;
      break;
    case 15:
    case 16:
    case 17:
      name = thunderstorms;
      break;
    case 18:
      name = rain;
      break;
    case 19:
    case 20:
    case 21:
      name = flurries;
      break;
    case 22:
    case 23:
      name = snow;
      break;
    case 24:
      name = ice;
      break;
    case 25:
      name = sleet;
      break;
    case 26:
      name = freezingRain;
      break;
    case 29:
      name = rainSnow;
      break;
    case 30:
      name = hot;
      break;
    case 31:
      name = cold;
      break;
    case 32:
      name = windy;
      break;
    case 33:
      name = clearNight;
      break;
    case 34:
      name = mostlyClear;
      break;
    case 35:
      name = cloudyNight;
      break;
    case 36:
      name = clouds;
      break;
    case 37:
      name = hazyMoon;
      break;
    case 38:
      name = mostlyCloudy;
      break;
    case 39:
    case 40:
      name = cloudyShowers;
      break;
    case 41:
    case 42:
      name = cloudyStorms;
      break;
    case 43:
      name = cloudyFlurries;
      break;
    case 44:
      name = cloudySnow;
      break;
    default:
      name = "";
      console.warn("Unexpected weather condition code found: " + conditionCode);
  }
  return name;
}

if (companion.permissions.granted("access_location")) {
  // Refresh on companion launch
  refreshData();

  // Schedule a refresh every 30 minutes
  companion.wakeInterval = wakeTime;
  companion.addEventListener("wakeinterval", refreshData);
} else {
  console.error("This app requires the access_location permission.");
}