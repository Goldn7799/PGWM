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
  console.log(`Packet Sent : [ ${totalPacket} ]`)
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
console.log('Starting...')
updateData()
// getPing().then((res) => { console.log(res) }).catch((err) => { console.log(err) })

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
