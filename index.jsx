import Plugin from '@structures/plugin';

import { Guilds, Users, Channels } from '@webpack/stores';
import { Dispatcher } from '@webpack/common';
import { bulk, filters } from '@webpack';
import { Events } from './constants';
import { DMs } from '@webpack/api';
import { Icon } from '@components';
import { create } from '@patcher';
import Toasts from '@api/toasts';
import React from 'react';

import Settings from './components/Settings';

const Patcher = create('relationships-notifier');

const [
   Relationships,
   Guild
] = bulk(
   filters.byProps('removeRelationship'),
   filters.byProps('leaveGuild')
);

export default class RelationshipsNotifier extends Plugin {
   constructor(...args) {
      super(...args);

      this.cache = {
         guilds: Object.values(Guilds.getGuilds()),
         groups: Object.values(Channels.getMutablePrivateChannels()).filter(c => c.type === 3)
      };

      this.history = {
         friend: null,
         guild: null,
         group: null
      };

      for (const event of Events) {
         this[event] = this[event].bind(this);
      }
   }

   start() {
      Patcher.after(Relationships, 'removeRelationship', (_, [friend]) => {
         this.history.friend = friend;
      });

      Patcher.after(Guild, 'leaveGuild', (_, [guild]) => {
         this.history.guild = guild;
         this.removeFromCache('guilds', guild);
      });

      Patcher.after(DMs, 'closePrivateChannel', (_, [group]) => {
         this.history.group = group;
         this.removeFromCache('groups', group);
      });

      for (const event of Events) {
         Dispatcher.subscribe(event, this[event]);
      }
   }

   stop() {
      Patcher.unpatchAll();

      for (const event of Events) {
         Dispatcher.unsubscribe(event, this[event]);
      }
   }

   getSettingsPanel() {
      return Settings;
   }

   removeFromCache(type, id) {
      const idx = this.cache[type].indexOf(this.cache[type].find(i => i.id === id));
      if (!~idx) return;

      this.cache[type].splice(idx, 1);
   }

   GUILD_CREATE(data) {
      this.cache.guilds.push(Guilds.getGuild(data.guild.id));
   }

   GUILD_MEMBER_REMOVE(data) {
      if (this.history.guild === data.guildId) {
         return this.mostRecentlyLeftGuild = null;
      }

      if (data.user.id !== Users.getCurrentUser().id) return;
      const guild = this.cache.guilds.find(g => g.id == data.guildId);
      if (!guild || guild.isLurker()) return;

      this.removeFromCache('guilds', guild.id);
      if (this.settings.get('kick', true)) {
         this.notify('kick', guild, "You've been kicked/banned from %servername");
      }

      this.history.guild = null;
   }

   RELATIONSHIP_REMOVE({ relationship }) {
      const type = relationship.type;
      if (type === 4 || this.history.friend === relationship.id) {
         return this.history.friend = null;
      }

      const user = Users.getUser(relationship.id);
      if (!user) return;

      if (type === 1 && this.settings.get('remove', true)) {
         return this.notify('remove', user, '%username#%usertag removed you as a friend.');
      } else if (type === 3 && this.settings.get('friend-cancel', true)) {
         return this.notify('friend-cancel', user, '%username#%usertag cancelled their friend request.');
      }

      this.history.friend = null;
   }

   CHANNEL_CREATE({ channel }) {
      if (channel?.type !== 3) return;
      if (this.cache.groups.find(g => g.id === channel.id)) return;

      this.cache.groups.push(channel);
   }

   CHANNEL_DELETE({ channel }) {
      if (channel?.type !== 3) return;

      const cached = this.cache.groups.find(g => g.id === channel.id);
      if (!cached) return;

      this.removeFromCache('groups', channel.id);
      if (this.settings.get('group', true)) return;

      this.notify('group', channel, "You've been removed from the group %groupname");
   }

   notify(type, instance, defaults) {
      const string = this.settings.get(`${type}Text`, defaults);
      const data = {
         content: this.format(type, string, instance),
         buttons: []
      };

      if (type === 'friend-cancel' || type === 'remove') {
         data.buttons = [{
            text: 'Open DM',
            color: 'red',
            look: 'outlined',
            onClick: () => {
               DMs.openPrivateChannel(instance.id);
            }
         }];
      }

      const needsFocus = this.settings.get('toasts-focus', true);
      const focus = (needsFocus && document.hasFocus() || !needsFocus && !document.hasFocus());

      if (this.settings.get('use-toasts', true) && focus) {
         Toasts.open({
            title: 'Relationships Notifier',
            color: 'var(--info-danger-foreground)',
            icon: (p) => <Icon name='WarningCircle' {...p} />,
            content: data.content,
            buttons: data.buttons
         });
      }

      if (this.settings.get('use-desktop-notifications', true)) {
         const needsFocus = this.settings.get('desktop-focus', true);
         if (needsFocus && document.hasFocus() || !needsFocus && !document.hasFocus()) return;

         const icon = this.#buildIconURL(instance);
         console.log(icon);
         const notification = new Notification('Relationships Notifier', {
            body: data.content,
            icon
         });

         if (type === 'friend-cancel' || type === 'remove') {
            notification.onclick = () => {
               DMs.openPrivateChannel(instance.id);
            };
         }
      }
   };

   #buildIconURL(instance) {
      if (!instance) return;
      const data = { url: null };

      if ((instance.members || instance.recipients) && instance.icon) {
         if (instance.type === 3) {
            data.url = 'https://cdn.discordapp.com/channel-icons';
         } else {
            data.url = 'https://cdn.discordapp.com/icons';
         }

         const icon = instance.icon;
         const isAnimated = icon.startsWith('a_');
         data.url += `${instance.id}/${icon}.${isAnimated ? 'gif' : 'png'}?size=4096`;
      }

      return data.url ?? instance.getAvatarURL?.();
   }

   format(type, text, object) {
      switch (type) {
         case 'remove':
         case 'friend-cancel':
            return text.replace('%username', object.username).replace('%usertag', object.discriminator).replace('%userid', object.id);
         case 'kick':
            return text.replace('%servername', object.name).replace('%serverid', object.id);
         case 'group':
            const group = object.name.length ? object.name : object.recipients.map(id => Users.getUser(id).username).join(', ');
            return text.replace('%groupname', group).replace('%groupid', object.id);
         default:
            const name = object.name.length ? object.name : object.recipients.map(id => Users.getUser(id).username).join(', ');
            return text.replace('%name', name);
      }
   }
};
