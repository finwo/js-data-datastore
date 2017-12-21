module.exports = {
  table : {
    schema: {
      title           : 'table',
      description     : 'Default schema for table entities',
      type            : 'object',
      properties      : {
        code       : {
          type        : 'string',
          description : 'Unique code of table'
        },
        max_chairs : {
          type        : 'integer',
          description : 'max number of chairs'
        }
      }
    },
    relations : {
      hasMany : {
        chair : {
          localField : 'chairs',
          foreignKey : 'table_code'
        }
      }
    }
  },
  chair : {
    schema: {
      title           : 'chair',
      description     : 'Default schema for chair entities',
      type            : 'object',
      properties      : {
        code       : {
          type        : 'string',
          description : 'Unique code of chair'
        },
        table_code : {
          type        : 'string',
          description : 'id of table'
        }
      }
    },
    relations : {
      belongsTo : {
        table : {
          localField : 'table',
          foreignKey : 'table_code'
        }
      },
      hasOne : {
        guest : {
          localField : 'guest',
          foreignKey : 'chair_code'
        }
      }
    }
  },
  guest : {
    schema: {
      title           : 'guest',
      description     : 'Default schema for guest entities',
      type            : 'object',
      properties      : {
        name       : {
          type        : 'string',
          description : 'Name of guest'
        },
        code       : {
          type        : 'string',
          description : 'Unique code of guest'
        },
        chair_code : {
          type        : 'string',
          description : 'id of chair'
        }
      }
    },
    relations : {
      belongsTo : {
        chair : {
          localField : 'chair',
          foreignKey   : 'chair_code'
        }
      }
    }
  }
};
