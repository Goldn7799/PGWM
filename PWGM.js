const config = {
  destination: 'http://api.google.com',
  method: "GET"
}

const data = {
  pingHistory: [],
  currentPing: 0,
  avgPing: '-',
  lowerPing: 0,
  higherPing: 0,
  packetLoss: 0,
  packetAcc: 0,
  start: false,
  usedDataByte: 0,
  pingOnlyHistory: {
    fim: '-',
    tem: '-',
    twm: '-',
    thm: '-'
  }
}

function updateDisplay() {
  console.clear()
  console.log('----------[ PING MONITOR ]----------')
  console.log(`Ping : [ ${data.currentPing}ms ]`)
  console.log(`AVG : [ ${data.avgPing}ms ]${(data.pingHistory.length >= 50) ? '' : ` (${Math.round(data.pingHistory.length / 50 * 100)}%)`}`)
  console.log(`Lower : [ ${data.lowerPing}ms ]`)
  console.log(`Higher : [ ${data.higherPing}ms ]`)
  const totalPacket = data.packetAcc + data.packetLoss;
  console.log(`Packet Sent : [ ${totalPacket} ] ( ${(data.usedDataByte / (1 << 20)).toFixed(2)}MB )`)
  console.log(`Packet Recived : [ ${Math.round(data.packetAcc / totalPacket * 100)}% ]`)
  console.log(`Packet Loss : [ ${Math.round(data.packetLoss / totalPacket * 100)}% ]`)
  console.log('')
  console.log(`Ping 5m 10m 20m 30m : [ ${data.pingOnlyHistory.fim}ms | ${data.pingOnlyHistory.tem}ms | ${data.pingOnlyHistory.twm}ms | ${data.pingOnlyHistory.thm}ms ]`)
  console.log('')
  console.log('----------< LOGS >----------')
  const copyPingOnlyHistory = JSON.parse(JSON.stringify(data.pingHistory))
  let pingOnly = copyPingOnlyHistory.reverse().splice(0, 10).reverse();
  pingOnly.forEach((res) => {
    if (res.status === 7412) {
      console.log("Can't Reach destination");
    } else if (res.status === 7133) {
      console.log("Request Time Out");
    } else if (res.status === 3770) {
      console.log(res.messsage);
    } else {
      console.log(`[${(res.success) ? 'SUCCESS' : 'FAILED'}] Ping to ${config.destination} (${res.status}) ${res.ping}ms`)
    }
  })
}

async function getPing() {
  try {
    const request = new Request(config.destination, { method: config.method });
    return new Promise((resolve) => {
      const start = Date.now();
      fetch(request).then((res) => {
        const end = Date.now();
        // const rawPing = end - start;
        // const resSize = Number(res.headers.get('Content-Length'))
        // const ping = Math.round((resSize / rawPing) * 32)
        data.usedDataByte += Number(res.headers.get('Content-Length'))
        const ping = end - start - 105;
        resolve({
          ping,
          status: res.status,
          success: true
        })
      }).catch((_) => {
        const end = Date.now();
        const ping = end - start;
        resolve({
          ping,
          status: 7412,
          success: false
        })
      })
      setTimeout(() => {
        const end = Date.now();
        const ping = end - start;
        resolve({
          ping,
          status: 7133,
          success: false
        })
      }, 5000);
    })
  } catch(err) {
    console.log(err)
    return {
      ping: 0,
      status: 3770,
      success: false,
      messsage: err
    }
  }
}

function updateData() {
  getPing().then((res) => {
    data.pingHistory.push(res);
    if (!data.start) {
      data.start = true;
      data.lowerPing = res.ping
    };
    if (data.pingHistory.length > 50) {
      data.pingHistory.splice(0, 1);
    };
    if (res.success) {
      data.currentPing = res.ping;
      data.packetAcc++;
      if (data.higherPing <= res.ping) {
        data.higherPing = res.ping;
      };
      if (data.lowerPing >= res.ping) {
        data.lowerPing = res.ping
      };
      if (data.pingHistory.length >= 50) {
        const pingOnlyHistory = data.pingHistory.map((datas) => {
          if (datas.success) {
            return datas.ping
          }
        })
        let totalAvgPing = 0;
        for (let i = 0; i < data.pingHistory.length; i++) {
          totalAvgPing += pingOnlyHistory[i];
        }
        data.avgPing = Math.round(totalAvgPing / pingOnlyHistory.length);
      };
      updateDisplay()
      if (res.ping >= 500) {
        setTimeout(() => {
          updateData()
        }, 500);
      } else {
        setTimeout(() => {
          updateData()
        }, 800);
      }
    } else {
      data.packetLoss++;
      updateDisplay()
      setTimeout(() => {
        updateData()
      }, 900);
    }
  })
}
let loadingActive = true;
let loadingStatus = 'Loading Test...';
let version = '1.2.12'
function loading(onAnimate) {
  const loader = ['-', '/', '-', '\\'];
  console.clear()
  console.log('----------[ WELCOME ]----------')
  console.log(`PWGM V${version}`)
  console.log('')
  console.log(`Destination : ${config.destination}`)
  console.log(`Method : ${config.method}`)
  console.log('')
  console.log(`Starting [${loader[onAnimate]}] | ${loadingStatus}`);
  setTimeout(() => {
    if (onAnimate >= loader.length-1) {
      if (loadingActive) {
        loading(0)
      };
    } else {
      if (loadingActive) {
        loading(onAnimate + 1)
      };
    }
  }, 250);
}
loading(0)
function nextStep() {
  setTimeout(() => {
    setInterval(() => {
      data.pingOnlyHistory.fim = data.currentPing;
    }, 300000)
    setInterval(() => {
      data.pingOnlyHistory.tem = data.currentPing;
    }, 600000)
    setInterval(() => {
      data.pingOnlyHistory.twm = data.currentPing;
    }, 1200000)
    setInterval(() => {
      data.pingOnlyHistory.thm = data.currentPing;
    }, 1800000)
    loadingStatus = "Testing destination..."
    getPing().then((res) => {
      if (res.success) {
        loadingStatus = `Destination reached (${res.status})[${res.ping}ms]`
        setTimeout(() => {
          loadingActive = false
          updateData()
        }, 1600);
      } else {
        loadingStatus = `Can't Reach destination`
        setTimeout(() => {
          loadingActive = false
          updateData()
        }, 1600);
      }
    })
  }, 2000);
}
setTimeout(async () => {
  loadingStatus = "Checking Updates..."
  const requestU = new Request('https://raw.githubusercontent.com/Goldn7799/PGWM/main/properties.json');
  const resURaw = await fetch(requestU);
  const resU = await resURaw.json();
  const ver = {
    ser: `${resU.version}`.split('.'),
    loc: version.split('.')
  }
  function checkVersion(id) {
    if (Number(ver.ser[id]) > Number(ver.loc[id])) {
      loadingStatus = 'You need to update PWGM to V' + resU.version
      setTimeout(() => {
        loadingActive = false;
      }, 300);
    } else if (Number(ver.ser[id]) < Number(ver.loc[id])) {
      loadingStatus = 'You are using unOfficial Version'
      nextStep()
    } else if ((id >= ver.ser.length-1) ? false : true) {
      setTimeout(() => {
        checkVersion(id + 1)
      }, 0);
    } else {
      loadingStatus = 'You are using Latest Version!'
      nextStep()
    }
  }
  checkVersion(0)
}, 500);
// getPing().then((res) => { console.log(res) }).catch((err) => { console.log(err) })
