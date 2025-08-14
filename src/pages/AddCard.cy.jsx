import React from 'react'
import AddCard from './AddCard'
/*
Refactor
  1) Criar função alertErrorHaveText
  2) Array de mensagens de erro
  3) Criar função fillCardForm
  4) beforeEach
  5) Spread Operator ...myCard
*/

Cypress.Commands.add('alertErrorHaveText', (expectText) => {
  cy.contains('.alert-error', expectText)
    .should('be.visible');
})

Cypress.Commands.add('fillCardForm', (card) => {
  cy.get('[data-cy="number"]').type(card.number)
  cy.get('[data-cy="holderName"]').type(card.holderName)
  cy.get('[data-cy="expirationDate"]').type(card.expirationDate)
  cy.get('[data-cy="cvv"]').type(card.cvv)
})

Cypress.Commands.add('submitCardForm', () => {
  cy.get('[data-cy="saveMyCard"]').click()
})

describe('<AddCard />', () => {

  const myCard = {
    number: '4242424242424242',
    holderName: 'Fulano de Tal',
    expirationDate: '12/35',
    cvv: '123',
    bank: 'neon'
  }

  beforeEach(() => {
    cy.viewport(1440, 900);
    cy.mount(<AddCard />);
  })

  it('exibe erros quando os campos não são informados', () => {

    cy.contains('button', 'Adicionar Cartão').click();

    const alerts = [
      'Número do cartão é obrigatório',
      'Nome do titular é obrigatório',
      'Data de expiração é obrigatória',
      'CVV é obrigatório',
      'Selecione um banco'
    ];

    alerts.forEach((alert) => {
      cy.alertErrorHaveText(alert)
    })

    /*
        cy.contains('.alert-error', 'Número do cartão é obrigatório')
          .should('be.visible');
        cy.contains('.alert-error', 'Nome do titular é obrigatório')
          .should('be.visible');
        cy.contains('.alert-error', 'Data de expiração é obrigatória')
          .should('be.visible');
        cy.contains('.alert-error', 'CVV é obrigatório')
          .should('be.visible');
        cy.contains('.alert-error', 'Selecione um banco')
          .should('be.visible');
    */
  })

  it('deve cadastrar cartão de crédito', () => {
    /*
    cy.contains('label', 'Número do Cartão')
      .parent()
      .find('input').type(myCard.number)    
    */

    cy.fillCardForm(myCard)

    cy.get(`[data-cy="bank-${myCard.bank}"]`).click()
    //cy.contains('button', 'Neon').click()

    cy.intercept('POST', 'http://wallet.cardfify.dev/api/cards', (req) => {
      req.reply({
        statusCode: 201,
        body: myCard
      })
    }).as('addCard')

    cy.submitCardForm()

    cy.wait('@addCard')

    cy.get('.notice-success')
      .should('be.visible')
      .and('have.text', 'Cartão cadastrado com sucesso!')

  })

  it('valida nome do titular com menos 2 caracteres', () => {
    
    cy.fillCardForm({...myCard, holderName: 'F'})

    cy.submitCardForm()

    cy.alertErrorHaveText('Nome deve ter pelo menos 2 caracteres')

  })

  it('valida data de expiração invalida', () => {

    cy.fillCardForm({...myCard, expirationDate: '13/35'})

    cy.submitCardForm()

    cy.alertErrorHaveText('Data de expiração inválida ou vencida')

  })

  it('valida cvv com menos de 3 digitos', () => {

    cy.fillCardForm({...myCard, cvv: '1'})

    cy.submitCardForm()

    cy.alertErrorHaveText('CVV deve ter 3 ou 4 dígitos')

  })
})