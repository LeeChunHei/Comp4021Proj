import threading
import socket
import sys
import os
from queue import Queue

class Socket():
    def __init__(self, socket_address, listener):
        try:
            os.unlink(socket_address)
        except OSError:
            if os.path.exists(socket_address):
                raise
        self.port = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        print('Starting up socket on %s' % socket_address)
        self.port.bind(socket_address)
        self.port.listen(1)
        self.running=threading.Event()
        self.running.set()
        self.connection=None
        self.client_address=None
        self.read_listener = listener
        self.read_data=None
        self.read_thread = threading.Thread(target = self._read)
        self.read_thread.start()
        self.send_queue=Queue()
        self.send_thread = threading.Thread(target = self._send)
        self.send_thread.start()

    def __del__(self):
        print('Closing socket')
        self.running.clear()
        self.read_thread.join()
        self.send_thread.join()
        self.port.close()

    def send(self, data):
        if self.connection!=None and self.client_address!=None:
            self.send_queue.put(data)

    def _send(self):
        while self.running.is_set():
            send_data = self.send_queue.get(True).encode()
            if self.connection!=None and self.client_address!=None:
                self.connection.sendall(send_data)


    def _read(self):
        while self.running.is_set():
            if self.connection==None or self.client_address==None:
                self.connection, self.client_address = self.port.accept()
                print('Connected with %s'%self.client_address)
            self.read_data = self.connection.recv(2048)
            self.read_listener(self.read_data)
