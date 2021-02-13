const electron = require('electron');
const { remote, shell, ipcRenderer } = electron;
const path = require("path")
const FileManager = require(path.join(__dirname, '/utils/FileManager.js'));
const tmi = require('tmi.js');

const configuration = new FileManager({
  configName: 'configuration',
  defaults: {
    activate: false,
    channels: [
      "ninja"
    ]
  }
});

const client = new tmi.Client({
  options: { debug: true, messagesLogLevel: "info" },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: 'ChatWallpaper',
    password: 'oauth:euraxrj58uiojni2qkoem7a3nsr9n7'
  },
  channels: configuration.get("channels")
});

const messages = []

document.addEventListener("DOMContentLoaded", async () => {
  client.connect().catch(console.error);
  client.on('message', (channel, tags, message, self) => {
    if (self) return;
    console.log(tags);
    messageWithEmotes = formatEmotes(message, tags.emotes);
    var formatMessage = `<p>${messageWithEmotes}</p>`;

    ipcRenderer.send('add:chat', formatMessage);
  });

  createTags();

})

function createTags(){
  [].forEach.call(document.getElementsByClassName('tags-input'), function (el) {
    let hiddenInput = document.createElement('input'),
      mainInput = document.createElement('input'),
      tags = [];

    hiddenInput.setAttribute('type', 'hidden');
    hiddenInput.setAttribute('name', el.getAttribute('data-name'));

    mainInput.setAttribute('type', 'text');
    mainInput.classList.add('main-input');
    mainInput.setAttribute("placeholder", "Add channels name")
    mainInput.setAttribute("id", "channels-input")
    mainInput.addEventListener('input', function () {
      let enteredTags = mainInput.value.split(',');
      if (enteredTags.length > 1) {
        enteredTags.forEach(function (t) {
          let filteredTag = filterTag(t);
          if (filteredTag.length > 0)
            addTag(filteredTag);
        });
        mainInput.value = '';
      }
    });

    mainInput.addEventListener('keydown', function (e) {
      let keyCode = e.which || e.keyCode;
      if(keyCode === 13 && mainInput.value.length >= 4){
        var text = mainInput.value.trim();
        addTag(text.startsWith("#") ? text : "#"+text);
        mainInput.value = '';
      }
      if (keyCode === 8 && mainInput.value.length === 0 && tags.length > 0) {
        removeTag(tags.length - 1);
      }
    });

    el.appendChild(mainInput);
    el.appendChild(hiddenInput);

    configuration.get("channels").forEach((e,k) => {
      addTag(e.trim());
    })
    function addTag(text) {
      if(tags.filter((e) => e.text === text).length == 0 && tags.length < 5 && text.length < 25){
        let tag = {
          text: text,
          element: document.createElement('span'),
        };

        tag.element.classList.add('tag');
        tag.element.textContent = tag.text;

        let closeBtn = document.createElement('span');
        closeBtn.classList.add('close');
        closeBtn.addEventListener('click', function () {
          removeTag(tags.indexOf(tag));
        });
        tag.element.appendChild(closeBtn);

        tags.push(tag);

        el.insertBefore(tag.element, mainInput);

        refreshTags();
      }
    }

    function removeTag(index) {
      let tag = tags[index];
      tags.splice(index, 1);
      el.removeChild(tag.element);
      refreshTags();
    }

    function refreshTags() {
      let tagsList = [];
      tags.forEach(function (t) {
        tagsList.push(t.text);
      });
      hiddenInput.value = tagsList.join(',');
    }

    function filterTag(tag) {
      return tag.replace(/[^\w -]/g, '').trim().replace(/\W+/g, '-');
    }
  });
}

function formatEmotes(text, emotes) {
  var splitText = text.split('');
  for(var i in emotes) {
      var e = emotes[i];
      for(var j in e) {
          var mote = e[j];
          if(typeof mote == 'string') {
              mote = mote.split('-');
              mote = [parseInt(mote[0]), parseInt(mote[1])];
              var length =  mote[1] - mote[0],
                  empty = Array.apply(null, new Array(length + 1)).map(function() { return '' });
              splitText = splitText.slice(0, mote[0]).concat(empty).concat(splitText.slice(mote[1] + 1, splitText.length));
              splitText.splice(mote[0], 1, '<img class="emoticon" src="http://static-cdn.jtvnw.net/emoticons/v1/' + i + '/3.0">');
          }
      }
  }
  return splitText.join('');
}

document.getElementById('close').addEventListener('click', () => {
  var win = remote.getCurrentWindow();
  win.close();
})

document.getElementById('minimize').addEventListener('click', () => {
  var win = remote.getCurrentWindow();
  win.minimize();
})

document.getElementById("start-button").addEventListener('click', () => {
  console.log("INICIAR");
})