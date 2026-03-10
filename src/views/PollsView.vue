<template>

<div class="polls-container">

<h1 class="title">Events Voting</h1>

<!-- TOP EVENT -->

<div v-if="events.length" class="winner">
🏆 Top Event :
<b>{{ events[0].title }}</b>
({{ events[0].vote }} votes)
</div>

<div class="events-grid">

<div
v-for="event in events"
:key="event.id"
class="event-card"
>

<h2>{{ event.title }}</h2>

<p class="description">
{{ event.description }}
</p>

<p class="location">
📍 {{ event.location }}
</p>

<!-- PROGRESS BAR -->

<div class="progress">

<div
class="progress-bar"
:style="{ width: votePercent(event.vote) + '%' }"
></div>

</div>

<p class="votes">
{{ event.vote }} votes
</p>

<button
class="vote-btn"
@click="vote(event.id)"
:disabled="hasVoted(event.id)"
>

{{ hasVoted(event.id) ? "Voted" : "Vote" }}

</button>

</div>

</div>

</div>

</template>

<script setup>

import { ref, onMounted } from "vue"

import { db } from "@/services/firebase"

import {
collection,
addDoc,
query,
where,
updateDoc,
doc,
increment,
onSnapshot
} from "firebase/firestore"

import { getAuth } from "firebase/auth"

const auth = getAuth()

const events = ref([])

const votedEvents = ref([])

const totalVotes = ref(0)


// 🔹 LIVE EVENTS (بدون refresh)

const listenEvents = () => {

const colRef = collection(db,"events")

onSnapshot(colRef,(snapshot)=>{

let list = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}))

// ترتيب حسب votes

list.sort((a,b)=>b.vote-a.vote)

events.value = list

// حساب مجموع votes

totalVotes.value = list.reduce((sum,e)=>sum+e.vote,0)

})

}


// 🔹 CHECK USER VOTES

const checkVotes = async ()=>{

const user = auth.currentUser

if(!user) return

const q = query(
collection(db,"Votes"),
where("userid","==",user.uid)
)

onSnapshot(q,(snapshot)=>{

votedEvents.value = snapshot.docs.map(
doc=>doc.data().eventsid
)

})

}


// 🔹 HAS VOTED

const hasVoted = (eventId)=>{

return votedEvents.value.includes(eventId)

}


// 🔹 VOTE

const vote = async(eventId)=>{

const user = auth.currentUser

if(!user) return

if(hasVoted(eventId)){

alert("You already voted")

return

}

await addDoc(collection(db,"Votes"),{

userid:user.uid,
eventsid:eventId

})

const refDoc = doc(db,"events",eventId)

await updateDoc(refDoc,{

vote:increment(1)

})

}


// 🔹 PROGRESS %

const votePercent = (votes)=>{

if(totalVotes.value===0) return 0

return Math.round((votes/totalVotes.value)*100)

}


onMounted(()=>{

listenEvents()

checkVotes()

})

</script>

<style scoped>

.polls-container{
max-width:1000px;
margin:auto;
padding:30px;
}

.title{
margin-bottom:20px;
}

.winner{
background:#fff3cd;
padding:10px;
border-radius:8px;
margin-bottom:20px;
}

.events-grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(280px,1fr));
gap:20px;
}

.event-card{
background:white;
padding:20px;
border-radius:12px;
box-shadow:0 4px 15px rgba(0,0,0,0.1);
transition:0.2s;
}

.event-card:hover{
transform:translateY(-5px);
}

.description{
color:#555;
}

.location{
font-size:14px;
margin-top:8px;
}

.progress{
background:#eee;
height:8px;
border-radius:6px;
margin-top:15px;
overflow:hidden;
}

.progress-bar{
background:#42b883;
height:100%;
transition:0.4s;
}

.votes{
margin-top:10px;
font-size:14px;
}

.vote-btn{
margin-top:10px;
padding:8px 16px;
background:#42b883;
color:white;
border:none;
border-radius:6px;
cursor:pointer;
}

.vote-btn:disabled{
background:gray;
cursor:not-allowed;
}

</style>