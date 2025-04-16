'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Devices', null, {});
  },

  async down (queryInterface, Sequelize) {
    // This migration cannot be rolled back as it deletes data
  }
};
