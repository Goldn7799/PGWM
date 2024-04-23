const config = {
  destination: 'http://google.com'
}

const data = {
  pingHistory: [],
  currentPing: 0,
  avgPing: '-',
  lowerPing: 0,
  higerPing: 0,
  packetLoss: 0,
  packetAcc: 0,
  start: false,
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
  console.log(`AVG : [ ${data.avgPing}ms ]`)
  console.log(`Lower : [ ${data.lowerPing}ms ]`)
  console.log(`Higer : [ ${data.higerPing}ms ]`)
  console.log(`Packet Acc : [ ${data.packetAcc} ]`)
  console.log(`Packet Loss : [ ${data.packetLoss} ]`)
  console.log('')
  console.log(`Ping 5m 10m 20m 30m : [ ${data.pingOnlyHistory.fim}ms | ${data.pingOnlyHistory.tem}ms | ${data.pingOnlyHistory.twm}ms | ${data.pingOnlyHistory.thm}ms | ]`)
  console.log('')
  console.log('----------< LOGS >----------')
  const copyPingOnlyHistory = JSON.parse(JSON.stringify(data.pingHistory))
  let pingOnly = copyPingOnlyHistory.reverse().splice(0, 10).reverse();
  pingOnly.forEach((res) => {
    console.log(`Ping to ${config.destination} (${res.status}) ${res.ping}ms`)
  })
}

async function getPing() {
  const start = Date.now();
  const res = await fetch(`${config.destination}`);
  const end = Date.now();
  return {
    ping: end-start-100,
    status: res.status
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
    if (res.status === 200) {
      data.currentPing = res.ping;
      data.packetAcc++;
      if (data.higerPing <= res.ping) {
        data.higerPing = res.ping;
      };
      if (data.lowerPing >= res.ping) {
        data.lowerPing = res.ping
      };
      if (data.pingHistory.length >= 50) {
        const pingOnlyHistory = data.pingHistory.map((datas) => {
          if (datas.status === 200) {
            return datas.ping
          }
        })
        let totalAvgPing = 0;
        for (let i = 0; i < data.pingHistory.length; i++) {
          totalAvgPing += pingOnlyHistory[i];
        }
        data.avgPing = Math.round(totalAvgPing / data.pingHistory.length);
      };
      updateDisplay()
      if (res.ping >= 500) {
        setTimeout(() => {
          updateData()
        }, 500);
      } else {
        setTimeout(() => {
          updateData()
        }, 1000);
      }
    } else {
      packetLoss++;
    }
  })
}
console.log('Starting...')
updateData()

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
