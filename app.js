const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
}



// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db=firebase.database();



function gotData(data) {
  const items = data.val();
  // Grab the keys to iterate over the object
  const keys = Object.keys(items);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // Look at each fruit object!
    console.log(items[key])
  }
}

function errData(err) {
  console.log(err)
}


const StorageCtrl=(function(){
  return{
    getStorageItems: function(date) {
      const ref = db.ref(`items/${date}`);
      let items=[];
      return new Promise((resolve,reject) => {
        if(ref!==null){
          ref.on("value", function(data){
            items=data.val();
            resolve(items)
          }, (err) => {
            reject(err);
          });
        }
        else {
          console.log('No collection')
          resolve(items);
        }
      })
    },

    getCalorieData: function(month,year,days) {
      const ref = db.ref("items");
      const items=[];
      return new Promise((resolve,reject) => {
        if(ref!==null){
          ref.on("value", function(data){
            res=data.val();
            const keys = Object.keys(res);
            for (let i = 0; i < keys.length; i++) {
              const verifier=keys[i].split('-');
              if(parseInt(verifier[1])===month && parseInt(verifier[2])===year) {
                let calories=0;
                //res[keys[i]].forEach((item) => calories+=item.calories)
                for (let key in res[keys[i]]) {
                  calories+=res[keys[i]][key].calories
                }
                items.push([parseInt(verifier[0]),calories]);
              }
            }
            resolve(items)
          }, (err) => {
            reject(err);
          });
        }
        else {
          console.log('No collection')
          resolve(items);
        }
      })
    },
    
    updateStorage: function(id,currentItem) {
      let today = new Date();
      const time=today.getHours()+':'+today.getMinutes();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();

      today = dd + '-' + mm + '-' + yyyy;
      //today='03-01-2021';
      const ref=db.ref(`items/${today}`)
      ref.orderByChild('name')
        .equalTo(id)
        .once('value', function (snapshot) {
          snapshot.forEach(function(child) {
            child.ref.update({name: currentItem.name,calories:currentItem.calories});
          });
      });
      
    },

    deleteStorage: function(id) {
      let today = new Date();
      const time=today.getHours()+':'+today.getMinutes();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();

      today = dd + '-' + mm + '-' + yyyy;
      //today='03-01-2021';
      const ref=db.ref(`items/${today}`)
      ref.orderByChild('name')
        .equalTo(id)
        .once('value', function (snapshot) {
          snapshot.forEach(function(child) {
            child.ref.remove();
          });
      });
      
    },

    addStorage: function(name,calories) {
      let today = new Date();
      const time=String(today.getHours()).padStart(2, '0')+':'+String(today.getMinutes()).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();

      today = dd + '-' + mm + '-' + yyyy;
      const data={name:name,calories:parseInt(calories),time:time};
      db.ref(`items/${today}`).push(data,(err) => {
        if(err) {
          console.log('There was an error')
        } else {
          console.log('Object saved')
        }
      });
    },

    clear: function() {
      let today = new Date();
      const time=today.getHours()+':'+today.getMinutes();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();

      today = dd + '-' + mm + '-' + yyyy;
      db.ref(`items/${today}`).remove();
    }

  }
})()

//Item Controller
const ItemCtrl=(function(){

  // Item Constructor
  const Item=function(id,name,calories) {
    this.id=id;
    this.name=name;
    this.calories=calories;
  }

  //Data structure
  const data={
    /*items:[
      {id:0,name:'Steak Dinner',calories:1200},
      {id:1,name:'Cookie',calories:400},
      {id:0,name:'Eggs',calories:300}
    ]*/
    items:[],
    currentItem:null,
    totalCalories:0
  }

  return {
    setCalories(calories) {
      data.totalCalories=calories;
    },
    getItems: function(){
      return data.items;
    },
    setItems: function(items){
      data.items=items;
    },
    addItem: function(item) {
      let id;
      if(data.items.length>0) {
        id=data.items[data.items.length-1].id+1;
      }
      else {
        id=0;
      }

      const newItem=new Item(id,item.name,parseInt(item.calories));
      data.items.push(newItem);
      data.totalCalories+=parseInt(item.calories);
      return newItem;
    },
    getCalories: function() {
      return data.totalCalories;
    },
    setCurrentItem: function(item) {
      data.currentItem=item;
    },
    getcurrentItem: function() {
      return data.currentItem;
    },

    

    updateItem: function(item) {
      const id=data.currentItem.name;
      data.totalCalories-=data.currentItem.calories;
      for (let i=0;i<data.items.length;i++) {
        if(data.items[i]===data.currentItem) {
          data.currentItem.name=item.name
          data.currentItem.calories=parseInt(item.calories);
          data.totalCalories+=data.currentItem.calories;
          data.items[i]=data.currentItem;
          break;
        }
      }
      UICtrl.showCalories(data.totalCalories);
      UICtrl.populate(data.items);
      UICtrl.clearEditState();
      UICtrl.changeState(null);
      const currentItem=data.currentItem;
      data.currentItem=null;
      StorageCtrl.updateStorage(id,currentItem);
    },

    deleteItem: function() {
      data.items=data.items.filter((item) => item!==data.currentItem);
      const id=data.currentItem.name;
      data.totalCalories-=data.currentItem.calories;
      UICtrl.showCalories(data.totalCalories);
      UICtrl.populate(data.items);
      UICtrl.clearEditState();
      UICtrl.changeState(null);
      data.currentItem=null;
      StorageCtrl.deleteStorage(id);
    },
    clearAll: function() {
      data.items=[];
      data.totalCalories=0;
      StorageCtrl.clear();
    }
  }

})();

//UI controller

const UICtrl=(function(){
  let currentState=null;
  return {
    getCurrentState: function() {
      return currentState;
    },
    changeState: function(state) {
      currentState=state;
    },
    populate: function(items) {
      let output='';
      items.forEach((item) => {
        output+=`<li class="collection-item" id=${item.name}>
        <strong>${item.name}: </strong> <em>${item.calories} Calories at ${item.time}</em>
        <a href="#" class="secondary-content">
          <i class="edit-item fa fa-edit"></i>
        </a>
      </li>`
      })

      document.querySelector('#item-list').innerHTML=output;
    },
    getItemInput: function() {
      return {
        name:document.querySelector('#item-name').value,
        calories:document.querySelector('#item-calories').value
      }
    },
    showSpinner: function() {
      document.querySelector('.center-align').innerHTML="Total Calories: <img class='spinner' src='img/loading.gif' width='80' height='80'></img>"
    },
    hideSpinner: function(calories) {
      document.querySelector('.center-align').innerHTML=`Total Calories: <span class='total-calories'>${calories}</span>`
    },
    addnewItem: function(newItem) {
      let today = new Date();
      const time=today.getHours()+':'+today.getMinutes();
      const li=document.createElement('li');
      li.className='collection-item';
      li.id=newItem.name
      li.innerHTML=`
      <strong>${newItem.name}: </strong>
      <em>${newItem.calories} Calories at ${time}</em>
      <a href="#" class="secondary-content">
        <i class="edit-item fa fa-edit"></i>
      </a>
      `
      document.querySelector('#item-list').insertAdjacentElement('beforeend',li);
    },
    
    clearAdd: function() {
      document.querySelector('#item-name').value=''
      document.querySelector('#item-calories').value=''
    },

    clearEditState: function() {
      UICtrl.clearAdd();
      document.querySelector('.add-btn').style.display='inline';
      document.querySelector('.update-btn').style.display='none';
      document.querySelector('.delete-btn').style.display='none';
      document.querySelector('.back-btn').style.display='none';
    },

    hideList: function() {
      document.querySelector('#item-list').style.display='none';
    },

    showList: function() {
      //console.log('We are ready to show list');
      document.querySelector('#item-list').style.display='block';
    },

    showCalories: function(calories) {
      document.querySelector('.total-calories').textContent=calories;
    },
    setEditFields: function() {
      const currentItem=ItemCtrl.getcurrentItem();
      document.querySelector('#item-name').value=currentItem.name;
      document.querySelector('#item-calories').value=currentItem.calories.toString();
      document.querySelector('.add-btn').style.display='none';
      document.querySelector('.update-btn').style.display='inline';
      document.querySelector('.delete-btn').style.display='inline';
      document.querySelector('.back-btn').style.display='inline';
    },
    removeItem: function(id) {
      const elementId=`#item-${id}`;
      document.querySelector(elementId).remove();
      UICtrl.showCalories(ItemCtrl.getCalories());
      const currentItems=ItemCtrl.getItems();
      if(currentItems.length===0) {
        UICtrl.hideList();
      }
    },
    removeAll: function() {
      document.querySelector('#item-list').innerHTML='';
      UICtrl.hideList();
    },
    hidePast: function() {
      document.querySelector('.card-content').style.display='none';
      document.querySelectorAll('.secondary-content').forEach((tag) => {
        tag.style.display='none'
      })
    },
    showPresent: function() {
      document.querySelector('.card-content').style.display='block';
      document.querySelectorAll('.secondary-content').forEach((tag) => {
        tag.style.display='block'
      })
    },
    future: function() {
      this.hidePast();
      document.querySelector('.collection').display='none'
    },
    showChart: async function(month,year) {
      month=parseInt(month)
      year=parseInt(year)
      const labels=[];
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const monthDays=[31,28,31,30,31,30,31,31,30,31,30,31];
      if(year%4==0) {
        if(year%100==0) {
          if(year%400==0) {
            monthDays[1]=29;
          }
        }
        else {
          monthDays[1]=29;
        }
      }
      
      const data=[];

      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();

      if(parseInt(yyyy)>year || (parseInt(yyyy)===year && parseInt(mm)>month)) {
        alert('Data not available')
        return;
      }

      if(parseInt(yyyy)===year && parseInt(mm)===month) {
        //console.log('Entered correctly')
        monthDays[month-1]=parseInt(dd);
      }

      for (let i=1;i<monthDays[month-1]+1;i++) {
        labels.push(i);
        data.push(0)
      }

      StorageCtrl.getCalorieData(month,year,monthDays[month-1])
        .then((res) => {
          res.forEach((item) => {
            data[item[0]-1]=item[1]
          })

          console.log(data)

          const ctx = document.getElementById('chart').getContext('2d');
          const chart = new Chart(ctx, {
            // The type of chart we want to create
            type: 'line',
        
            // The data for our dataset
            data: {
                labels: labels,
                datasets: [{
                    label: `Intake for month of ${months[month-1]}`,
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: data,
                    fill:false
                }]
            },
        
            // Configuration options go here
            options: {
              responsive: true,
              maintainAspectRatio: false,
              legend: {
                  onClick: (e) => e.stopPropagation()
              }
            }
            
          });
          chart.canvas.parentNode.style.height = '650px';
          chart.canvas.parentNode.style.width = '650px';
          //console.log(document.querySelectorAll('.information'))
          document.querySelectorAll('.information')[1].style.display='none';
          document.querySelector('.contain').style.display='none';
          
        })
    }
  }
})();

//App Controller
const App=(function(ItemCtrl,UICtrl,StorageCtrl){
  let date=new Date();
  let current;
  const monthDict=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayDict=['Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const loadEventListeners=function() {
    document.querySelector('.add-btn').addEventListener('click',addItemSubmit);
    document.querySelector('#item-list').addEventListener('click',clickEditItem);
    document.querySelector('.delete-btn').addEventListener('click',deleteItem);
    document.querySelector('.clear-btn').addEventListener('click',clearItems);
    document.addEventListener('keypress',(e) => {
      const currentState=UICtrl.getCurrentState();
      if(currentState && currentState==='edit' && (event.keyCode===13 || e.which===13)) {
        const item=UICtrl.getItemInput();
        ItemCtrl.updateItem(item);
        e.preventDefault();
      }
    })
    document.querySelector('.update-btn').addEventListener('click',(e) => {
      const currentState=UICtrl.getCurrentState();
      const item=UICtrl.getItemInput();
      ItemCtrl.updateItem(item);
      e.preventDefault();
    })

    document.querySelector(".prev").addEventListener("click", () => {
      date.setMonth(date.getMonth() - 1);
      renderCalendar();
    });
    
    document.querySelector(".next").addEventListener("click", () => {
      date.setMonth(date.getMonth() + 1);
      renderCalendar();
    });

    document.querySelector('.brand-logo').addEventListener('click',() => {
      window.location.reload();
    })

    document.querySelector('.modal-trigger').addEventListener('click',(e) => {
      document.querySelector('.contain').style.display='block';
      document.querySelectorAll('.information')[1].style.display='none'
      document.querySelector('.information').style.display='none';
    })

    document.querySelector('.back-btn').addEventListener('click',(e) => {
      UICtrl.clearEditState();
      UICtrl.changeState(null);
      e.preventDefault();
    })

    document.querySelector('.date').addEventListener('click',(e) => {
      if(e.target.tagName.toLowerCase() === 'h1') {
        const date=document.querySelector('.month-days').id.split('-')
        console.log(`Show Chart of ${date[2]}-${date[3]}`)
        UICtrl.showChart(date[2],date[3]);
      }
    })

    document.querySelector('.fa-window-close').addEventListener('click',(e) => {
      document.querySelector('.contain').style.display='none';
      document.querySelector('.information').style.display='block';
      const current_date=current.split('-');
      const d=current_date[1]+'-'+current_date[2]+'-'+current_date[3]
      const dNumber=parseInt(current_date[3]+current_date[2]+current_date[1]);
      let today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();
      today = dd + '-' + mm + '-' + yyyy;
      const tNumber=parseInt(yyyy+mm+dd);
      StorageCtrl.getStorageItems(d)
        .then((res) => {
          if(res) {
            const keys = Object.keys(res);
            const items=[];
            let calories=0;
            for (let i = 0; i < keys.length; i++) {
              calories+=res[keys[i]].calories
              items.push(res[keys[i]]);
            }
            UICtrl.showList();
            ItemCtrl.setItems(items);
            UICtrl.populate(items);
            ItemCtrl.setCalories(calories);
            UICtrl.hideSpinner(calories);
            renderCalendar();
          }
          else {
            ItemCtrl.setItems([]);
            UICtrl.hideSpinner(0);
          }
          if(d===today) {
            UICtrl.showPresent();
          }
          else if(dNumber>tNumber) {
            UICtrl.future();
          }
          else {
            UICtrl.hidePast();
          }
        })
        .catch((err) => {
          console.log('Something went wrong ',err)
          console.log('Hide spinner')
        })


    })


    document.querySelector('.days').addEventListener('click',(e) => {
      if(e.target.classList.contains('month-days')) {
        const prev=document.querySelector(`#${current}`)
        if(prev) {
          prev.classList.remove('today')
        }
        //document.querySelector(`#${current}`).classList.remove('today')
        current=e.target.id
        const current_date=current.split('-');
        const d = new Date(`${current_date[2]}-${current_date[1]}-${current_date[3]}`);
        const n = d.getDay();
        document.querySelector(".date p").textContent=`${dayDict[n]} ${monthDict[parseInt(current_date[2])-1]} ${current_date[1]} ${current_date[3]}`
        document.querySelector(`#${current}`).classList.add('today')
      }
    })
  }



  function clearItems(e) {
    ItemCtrl.clearAll();
    UICtrl.removeAll();
    UICtrl.clearEditState();
    UICtrl.clearAdd();
    UICtrl.showCalories(ItemCtrl.getCalories());
    UICtrl.changeState(null);
  }

  function deleteItem(e) {
    ItemCtrl.deleteItem();
    UICtrl.clearEditState();
    UICtrl.changeState(null);
    if(ItemCtrl.getItems().length===0) {
      UICtrl.hideList();
    }
    //UICtrl.removeItem(id);
    UICtrl.clearEditState();
    UICtrl.changeState(null);
  }

  function clickEditItem(e) {
    
    if(e.target.classList.contains('edit-item')) {
      //console.log(e.target)
      const name=e.target.parentNode.parentNode.id;
      const items=ItemCtrl.getItems();
      //console.log(items)
      for (let i=0;i<items.length;i++) {
        console.log(items[i].name.length,name.length)
        if(items[i].name==name) {
          console.log('I entered in ',items[i].name==name)
          ItemCtrl.setCurrentItem(items[i]);
          UICtrl.setEditFields();
          UICtrl.changeState('edit');
          //break;
        }
        else {
          console.log('I did not enter in ',items[i].name==name)
        }
      }
    }
    e.preventDefault();
  }

  

  function addItemSubmit(e) {
    console.log('Add');
    const input=UICtrl.getItemInput();

    if(input.name!=='' && input.calories!=='') {
      const newItem=ItemCtrl.addItem(input);
      //const items=ItemCtrl.getItems();
      //UICtrl.populate(items);
      UICtrl.showList();
      UICtrl.addnewItem(newItem);
      const calories=ItemCtrl.getCalories();
      UICtrl.showCalories(calories);
      UICtrl.clearAdd();
      StorageCtrl.addStorage(input.name,input.calories);
    }
    else {
      alert('Please fill both fields!')
    }
    e.preventDefault();
  }

  const renderCalendar = () => {
    //console.log(current)
    date.setDate(1);
  
    const monthDays = document.querySelector(".days");
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();
  
    const prevLastDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      0
    ).getDate();
  
    const firstDayIndex = date.getDay();
  
    const lastDayIndex = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDay();
  
    const nextDays = 7 - lastDayIndex - 1;
  
    document.querySelector(".date h1").textContent = months[date.getMonth()];
  
    document.querySelector(".date p").textContent = new Date().toDateString();
  
    let days = "";
  
    for (let x = firstDayIndex; x > 0; x--) {
      days += "<div class='prev-date'></div>";
    }
  
    for (let i = 1; i <= lastDay; i++) {
      let id='day-'+String(i).padStart(2, '0')+'-'+String(date.getMonth() + 1).padStart(2, '0')+'-'+date.getFullYear();
  
      if (id===current) {
        days += `<div class="today month-days" id=${id}>${i}</div>`;
      } else {
        days += `<div class='month-days' id=${id}>${i}</div>`;
      }
    }

    //<button class="waves-effect waves-light btn">Close</button>
  
    for (let j = 1; j <= nextDays; j++) {
      days += `<div class='next-date'></div>`;
    }
    monthDays.innerHTML = days;
  };

  return {
    init: function() {
      UICtrl.clearEditState();
      loadEventListeners();
      UICtrl.showSpinner();
      UICtrl.hideList();
      //current='day-'+String(date.getDate()).padStart(2, '0')+'-'+String(date.getMonth() + 1).padStart(2, '0')+'-'+date.getFullYear();
      let today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      const yyyy = today.getFullYear();
      today = dd + '-' + mm + '-' + yyyy;
      current=`day-${dd}-${mm}-${yyyy}`
      StorageCtrl.getStorageItems(today)
        .then((res) => {
          if(res) {
            const keys = Object.keys(res);
            const items=[];
            let calories=0;
            for (let i = 0; i < keys.length; i++) {
              calories+=res[keys[i]].calories
              items.push(res[keys[i]]);
            }
            UICtrl.showList();
            ItemCtrl.setItems(items);
            UICtrl.populate(items);
            ItemCtrl.setCalories(calories);
            UICtrl.hideSpinner(calories);
            renderCalendar();
          }
          else {
            ItemCtrl.setItems([]);
            UICtrl.hideSpinner(0);
            renderCalendar();
          }
        })
        .catch((err) => {
          console.log('Something went wrong ',err)
          console.log('Hide spinner')
        })
    
    },

    getCurrent() {
      return current;
    }
  }
})(ItemCtrl,UICtrl,StorageCtrl)



App.init();

