const checkBalance = (authedClient) => {
  return new Promise((resolve)=>{
    authedClient.getAccounts(function(error, response, data){
      if (error == null){
        let usdWallet = data.find((item)=>item.currency == 'USD');
        resolve({
          success: true,
          balance: parseFloat(usdWallet.available)
        });
      } else {
        resolve({
          success: false,
          message: error.data && error.data.message
        });
      }
    });
  })
}
exports.checkBalance = checkBalance;