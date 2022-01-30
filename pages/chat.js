import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import { createClient } from '@supabase/supabase-js';
import appConfig from '../config.json';
import { ButtonSendSticker } from '../src/components/ButtonSendSticker';

const SUPABASE_URL = 'https://aupylqxgnpgmdezdqxtv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzM3NzAwMSwiZXhwIjoxOTU4OTUzMDAxfQ.VX_LqcR-Ob1q1W0WxalLsA3mtcU9iZT6vJ86kD5_mZk';
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function listenMessagesInRealTime(addMessage) {
  return supabaseClient
      .from('messages')
      .on('INSERT', (response) => {
        addMessage(response.new);
      })
      .subscribe();
}

export default function ChatPage() {
  const routing = useRouter();
  // Get URL value. (http://localhost:3000/chat?username=THISVALUE)
  const loggedUser = routing.query.username;
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  
  useEffect(() => {
    supabaseClient
      .from('messages')
      .select('*')
      .order('id', { ascending: false })
      .then(({ data }) => {
        setMessageList(data);
      });

    const subscription = listenMessagesInRealTime((newMessage) => {
      // This arrow function is received by 'listenMessageInRealTime' how 'addMessage'
      setMessageList((currentListValue) => {
        return [
          newMessage,
          ...currentListValue,
        ]
      });
    });

    return () => {
      subscription.unsubscribe();
    }
  }, []);

  function handleNewMessage(newMessage) {
    const message = {
      // id: messageList.length + 1,
      from: loggedUser,
      text: newMessage,
    };

    supabaseClient
      .from('messages')
      .insert([message])
      .then(({ data }) => {
        console.log('Server insert response: ', data);
      });

    setMessage('');
  }

  return (
    <Box
      styleSheet={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: appConfig.theme.colors.primary[500],
        backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
        backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
        color: appConfig.theme.colors.neutrals['000']
      }}
    >
      <Box
        styleSheet={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
          borderRadius: '5px',
          backgroundColor: appConfig.theme.colors.neutrals[700],
          height: '100%',
          maxWidth: '95%',
          maxHeight: '95vh',
          padding: '32px',
        }}
      >
        <Header />
        <Box
          styleSheet={{
            position: 'relative',
            display: 'flex',
            flex: 1,
            height: '80%',
            backgroundColor: appConfig.theme.colors.neutrals[600],
            flexDirection: 'column',
            borderRadius: '5px',
            padding: '16px',
          }}
        >

          <MessageList messages={messageList} />

          <Box
            as="form"
            styleSheet={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <TextField
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
              }}
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleNewMessage(message);
                }
              }}
              placeholder="Enter your message here..."
              type="textarea"
              styleSheet={{
                width: '100%',
                border: '0',
                resize: 'none',
                borderRadius: '5px',
                padding: '6px 8px',
                backgroundColor: appConfig.theme.colors.neutrals[800],
                marginRight: '12px',
                color: appConfig.theme.colors.neutrals[200],
              }}
            />
            {/* Callback */}
            <ButtonSendSticker 
              onStickerClick={
                (sticker) => {
                  console.log('[USING THE COMPONENT] Clicked sticker: ', sticker);
                  handleNewMessage(':sticker:' + sticker);
                }
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function Header() {
  return (
    <>
      <Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
        <Text variant='heading5'>
          Chat
        </Text>
        <Button
          variant='tertiary'
          colorVariant='neutral'
          label='Logout'
          href="/"
        />
      </Box>
    </>
  )
}

function MessageList(props) {
  return (
    <Box
      tag="ul"
      styleSheet={{
        overflow: 'scroll',
        display: 'flex',
        flexDirection: 'column-reverse',
        flex: 1,
        color: appConfig.theme.colors.neutrals["000"],
        marginBottom: '16px',
      }}
    >
      {
        props.messages.map((message) => {
          return (
            <Text
              key={message.id}
              tag="li"
              styleSheet={{
                borderRadius: '5px',
                padding: '6px',
                marginBottom: '12px',
                hover: {
                  backgroundColor: appConfig.theme.colors.neutrals[700],
                }
              }}
            >
              <Box
                styleSheet={{
                  marginBottom: '8px',
                }}
              >
                <Image
                  styleSheet={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    display: 'inline-block',
                    marginRight: '8px',
                  }}
                  src={`https://github.com/${message.from}.png`}
                />
                <Text 
                  tag="strong" 
                  styleSheet={{
                    color: appConfig.theme.colors.neutrals[200],
                    display:'inline',
                  }}
                >
                  {message.from}
                </Text>
                <Text
                  styleSheet={{
                    fontSize: '10px',
                    marginLeft: '8px',
                    color: appConfig.theme.colors.neutrals[300],
                  }}
                  tag="span"
                >
                  {(new Date().toLocaleDateString())}
                </Text>
              </Box>
              {/* if ternary. React doesn't let you use common if with jsx. */}
              {
                message.text.startsWith(':sticker:') 
                  ? (
                    // ('It is a sticker')
                    <Image 
                      src={message.text.replace(':sticker:', '')} 
                      styleSheet={{
                        marginLeft: '32px',
                        maxWidth: '100px',
                      }}
                    />
                  ) 
                  : (
                    <Text
                      tag="p"
                      styleSheet={{
                        marginLeft: '32px',
                      }}
                    >
                      {message.text}
                    </Text>
                  )
              }
            </Text>
          )
        })
      }

    </Box>
  )
}