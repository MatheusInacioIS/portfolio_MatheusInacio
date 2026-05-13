# Detecção de Sentimento: Feliz vs. Triste
 
## 📝 Descrição do Projeto
Este projeto foi desenvolvido como uma Atividade Formativa com o objetivo de treinar um modelo de visão computacional capaz de distinguir entre pessoas felizes e tristes. Através da análise de um conjunto de dados composto por 40 fotos de pessoas e expressoes diferentes, o sistema busca classificar sentimentos com base em imagens.

O foco principal, além da classificação, foi a análise crítica de como algoritmos de aprendizado de máquina podem desenvolver vieses durante o treinamento e quais são as implicações éticas e sociais desses erros na identificação de sentimentos.
 
## 🚀 Tecnologias Utilizadas
* **Plataforma:** Teachable Machine (Google)
* **Recursos:** Webcam e upload de imagens
* **Dataset:** 40 fotografias de expressoes (Categorias: Felicidade e Tristeza)
 
## 📊 Resultados e Aprendizados
A atividade permitiu identificar como falhas na base de dados influenciam diretamente a precisão e a ética do modelo.
* **Mecanismo do Viés:** Identificamos que o algoritmo tende a classificar pessoas "felizes" como "tristes" caso estejam sem expressao completamente visível, o que corrompe a lógica de autenticidade.
* **Consequência Social:** Observou-se que pessoas tristes tambem poderiam ser classificadas como felizes, trazendo consequencia social em ambito de luto por exemplo.
* **Ação Mitigadora:** Para corrigir essas falhas, é necessária uma curadoria humana, estabelecendo critérios técnicos e precisos.
 
## 🔧 Como Executar
1. Capture ou reúna fotos de tênis (neste projeto, foram utilizados 40 exemplares).
2. Separe as imagens em classes específicas: "Original" e "Fake".
3. Realize o upload para a ferramenta Teachable Machine.
4. Treine o modelo e utilize a função "Preview" para testar a classificação via webcam ou novos arquivos.
