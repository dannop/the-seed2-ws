# Usa uma imagem oficial do Node.js
FROM node:20

# Define diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies)
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta usada pela aplicação
EXPOSE 8080

# Comando para rodar a aplicação
CMD ["npm", "start"]