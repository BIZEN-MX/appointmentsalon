const url = 'https://ckdwnrwrnpfrgnsqixjm.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZHducndybnBmcmduc3FpeGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MDg4MDQsImV4cCI6MjA4OTM4NDgwNH0.OL3ahc3JpDlVOvYoT1pUv9KggGXOQ7UM0ACXbB-Ml2c';
fetch(url).then(r => r.json()).then(d => {
  const appointments = d.definitions.appointments.properties;
  console.log('Columns:', Object.keys(appointments));
}).catch(e => console.error(e));
