class Solution {
    public char findKthBit(int n, int k) {
        long ll = 1;
        for (int i=1;i<n;i++){
            ll = ll*2+1;
        }
        return (char)dfs(ll,k);
    }
    public int dfs(long l,int k){
        if(l==1||k==1){
            return 0;
        }
        if(k==l/2+1){
            return 1;
        }
        if(k>l/2){
            return (dfs(l/2,l-k+1)+1)%2;
        }
        else{
            return dfs(l/2,k);
        }
    }
}
