public class HelloJava {  // 主类名HelloJava
    public static void main(String[] args) {  // 程序入口方法（固定格式）
        for (int i = 1; i < 10; i++) {
            for (int j = 1; j < i+1; j++) {
                System.out.print(j+"×"+i+"="+i*j+"\t");
            }
            System.out.println();
        }
    }
}