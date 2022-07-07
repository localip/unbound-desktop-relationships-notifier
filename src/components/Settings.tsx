import { FormText, FormTitle } from '@components/discord';
import { Switch, TextInput } from '@components/settings';
import { Category, Icon } from '@components';
import { makeStore } from '@api/settings';
import React from 'react';

interface SettingsProps {
   settings: ReturnType<typeof makeStore>;
}

export default class Settings extends React.Component<SettingsProps>{
   render() {
      const { settings } = this.props;

      return (<div>
         <Category
            title='Notifications'
            icon={p => <Icon name='Bell' {...p} />}
            description='Customize notification behaviour.'
            opened={settings.get('notifications-expanded', false)}
            onChange={() => settings.toggle('notifications-expanded', false)}
         >
            <Switch
               title='In-App Toasts'
               description='Display in-app toasts.'
               checked={settings.get('app-toasts', true)}
               onChange={() => settings.toggle('app-toasts', true)}
            />
            <Switch
               title='Focus In-App Toasts'
               description={'Display in-app toasts only when discord is focused.'}
               checked={settings.get('toasts-focus', true)}
               onChange={() => settings.toggle('toasts-focus', true)}
            />
            <Switch
               title='Desktop Notifications'
               description='Display desktop notifications.'
               checked={settings.get('use-desktop-notifications', true)}
               onChange={() => settings.toggle('use-desktop-notifications', true)}
            />
            <Switch
               title='Focus Desktop Notifications'
               description='Display desktop notifications even when discord is focused.'
               checked={settings.get('desktop-focus', false)}
               onChange={() => settings.toggle('desktop-focus', false)}
               endDivider={false}
            />
         </Category>
         <Category
            title='Events'
            icon={p => <Icon name='WarningCircle' {...p} />}
            description='Turn off notifications for individual events.'
            opened={settings.get('types-expanded', false)}
            onChange={() => settings.toggle('types-expanded', false)}
         >
            <Switch
               title='Friend Removal'
               description='Display notifications when someone removes you from their friends list.'
               checked={settings.get('remove', true)}
               onChange={() => settings.toggle('remove', true)}
            />
            <Switch
               title='Kick'
               description='Display notifications when you get kicked from a server.'
               checked={settings.get('kick', true)}
               onChange={() => settings.toggle('kick', true)}
            />
            <Switch
               title='Group Removal'
               description='Display notifications when you get kicked from a group chat.'
               checked={settings.get('group', true)}
               onChange={() => settings.toggle('group', true)}
            />
            <Switch
               title='Friend Request Cancel'
               description='Display notifications when someone cancells their friend request.'
               checked={settings.get('friend-cancel', true)}
               onChange={() => settings.toggle('friend-cancel', true)}
               endDivider={false}
            />
         </Category>
         <Category
            title='Text'
            icon={p => <Icon name='ChannelTextLimited' {...p} />}
            description='Customize the notifications the way you want.'
            opened={settings.get('text-expanded', false)}
            onChange={() => settings.toggle('text-expanded', false)}
         >
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem' }}>
               <div>
                  <FormTitle>Remove & Cancel Variables</FormTitle>
                  <FormText style={{ textAlign: 'center' }}>
                     %username
                     <br></br>
                     %userid
                     <br></br>
                     %usertag
                  </FormText>
               </div>
               <div>
                  <FormTitle>Kick & Ban Variables</FormTitle>
                  <FormText style={{ textAlign: 'center' }}>
                     %servername
                     <br></br>
                     %serverid
                  </FormText>
               </div>
               <div>
                  <FormTitle>Group Variables</FormTitle>
                  <FormText style={{ textAlign: 'center' }}>
                     %groupname
                     <br></br>
                     %groupid
                  </FormText>
               </div>
            </div>
            <br></br>
            <TextInput
               title='Removed Text'
               value={settings.get('removeText', '%username#%usertag removed you as a friend.')}
               onChange={v => settings.set('removeText', v)}
               description={'The text the notification will have when someone removes you.'}
            />
            <TextInput
               title='Cancelled Friend Request Text'
               value={settings.get('friendCancelText', '%username#%usertag cancelled their friend request.')}
               onChange={v => settings.set('friendCancelText', v)}
               description='The text the notification will have when someone cancells their friend request.'
            />
            <TextInput
               title='Kicked/Banned Text'
               value={settings.get('kickText', "You've been kicked/banned from %servername")}
               onChange={v => settings.set('kickText', v)}
               description='The text the notification will have when you get kicked/banned from a server.'
            />
            <TextInput
               title='Group Text'
               value={settings.get('groupText', "You've been removed from the group %groupname")}
               onChange={v => settings.set('groupText', v)}
               description='The text the notification will have when you get kicked from a group chat.'
               endDivider={false}
            />
         </Category>
      </div>);
   }
}