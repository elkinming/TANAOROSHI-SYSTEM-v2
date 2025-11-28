/**
 * Utility functions for form error handling and label translation
 */

/**
 * Maps error codes from backend to user-friendly internationalized message keys
 * @param errorCodesArray - Array of error codes from backend
 * @returns Array of internationalized message keys
 */
export const getUserErrors = (errorCodesArray: string[]) => {
  const userErrorCodes: string[] = [];
  const standardErrors = [
    { code: 'PK_CHECK_FAILED', msg:'msg.error.primaryKeyDuplicated'},
    { code: 'DATATYPE_CHECK_FAILED', msg:'msg.error.datatypeLenghtMismatch'},
    { code: 'DATATYPE_CHECK_FAILED_LENGTH', msg:'msg.error.datatypeConflict'},
    { code: 'TIME_LOGIC_CHECK_INVALID', msg:'msg.error.timeFrameInvalid'},
    { code: 'TIME_LOGIC_CHECK_CONFLICTED', msg:'msg.error.timeFrameConflicted'}
  ]
  errorCodesArray.forEach((errorItem) => {
    let newErrorItem: string = 'msg.error.Exception';
    standardErrors.forEach((standardError) => {
      if(standardError.code == errorItem){
        newErrorItem = standardError.msg;
      }
    })
    userErrorCodes.push(newErrorItem);
  })

  return userErrorCodes;
}

/**
 * Translates field names from backend format to Japanese labels
 * @param label - Field name from backend
 * @returns Japanese label for the field
 */
export const getLabelMessage = (label: string) => {
  let labelMessage = label;
  const labelMessages = {
    'company_code': '会社コード',
    'previous_factory_code': '従来工場コード',
    'product_factory_code': '商品工場コード',
    'start_operation_date': '運用開始日',
    'end_operation_date': '運用終了日',
    'previous_factory_name': '従来工場名',
    'product_factory_name': '商品工場名',
    'material_department_code': 'マテリアル部署コード',
    'environmental_information': '環境情報',
    'authentication_flag': '認証フラグ',
    'group_corporate_code': '企業コード',
    'integration_pattern': '連携パターン',
    'hulftid': 'HULFTID',
  }
  if(labelMessages[label as keyof typeof labelMessages]){
    labelMessage = labelMessages[label as keyof typeof labelMessages];
  }
  return labelMessage;
}


